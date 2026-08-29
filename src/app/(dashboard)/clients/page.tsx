'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Mail,
  Phone,
  MapPin,
  Building,
  Trash2,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  FilePlus,
  FileText,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import { Client, Organization } from '@/core/domain/types';
import { repository } from '@/core/adapters';
import { formatMoney } from '@/core/domain/money';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Suppression d'un client
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Formulaire Nouveau Client
  const [newClient, setNewClient] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    address: '',
    city: 'Dakar',
    country: 'Sénégal',
    taxIdNumber: '',
    notes: '',
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [org, list] = await Promise.all([
        repository.getOrganization(),
        repository.getClients(searchQuery),
      ]);
      setOrganization(org);
      setClients(list || []);
    } catch (err) {
      console.error('Erreur chargement clients:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.name.trim()) return;

    setIsSubmitting(true);
    setErrorToast(null);

    try {
      const orgId = organization?.id || 'a0000000-0000-0000-0000-000000000001';
      const created = await repository.createClient({
        ...newClient,
        name: newClient.name.trim(),
        companyName: newClient.companyName.trim(),
        orgId,
      });

      // Mise à jour immédiate et garantie de la liste des clients dans l'UI
      setClients((prev) => {
        const filtered = prev.filter((c) => c.id !== created.id && c.name.toLowerCase() !== created.name.toLowerCase());
        return [created, ...filtered];
      });

      setIsModalOpen(false);
      setSuccessToast(`Client « ${created.name} » enregistré avec succès ! Il est immédiatement sélectionnable.`);
      setTimeout(() => setSuccessToast(null), 5000);

      // Réinitialisation du formulaire
      setNewClient({
        name: '',
        companyName: '',
        email: '',
        phone: '',
        address: '',
        city: 'Dakar',
        country: 'Sénégal',
        taxIdNumber: '',
        notes: '',
      });

      // Rafraîchissement asynchrone en arrière-plan
      repository.getClients().then((fresh) => {
        if (fresh && fresh.length > 0) setClients(fresh);
      });
    } catch (err: any) {
      console.error('Erreur création client:', err);
      setErrorToast(err?.message || "Une erreur est survenue lors de l'enregistrement du client.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;
    setIsDeleting(true);
    setErrorToast(null);

    try {
      await repository.deleteClient(clientToDelete.id);
      setClients((prev) => prev.filter((c) => c.id !== clientToDelete.id));
      setSuccessToast(`Le client « ${clientToDelete.name} » a été supprimé avec succès.`);
      setTimeout(() => setSuccessToast(null), 5000);
      setIsDeleteModalOpen(false);
      setClientToDelete(null);
    } catch (err: any) {
      console.error('Erreur suppression client:', err);
      setErrorToast(err?.message || 'Erreur lors de la suppression du client.');
    } finally {
      setIsDeleting(false);
    }
  };

  const currency = organization?.currency || 'XOF';

  return (
    <div className="space-y-8 w-full">
      {/* Toast Succès */}
      {successToast && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 rounded-2xl flex items-center justify-between gap-3 text-sm text-emerald-900 dark:text-emerald-200 shadow-md animate-in fade-in-50">
          <div className="flex items-center gap-2.5 font-semibold">
            <CheckCircle2 className="w-5 h-5 text-[#0E7A55] shrink-0" />
            <span>{successToast}</span>
          </div>
          <Link href="/invoices/new">
            <Button size="sm" className="bg-[#0E7A55] hover:bg-[#0c6b4b] text-white text-xs font-bold shadow-xs">
              <FilePlus className="w-4 h-4 mr-1.5" /> Créer une Facture
            </Button>
          </Link>
        </div>
      )}

      {/* Toast Erreur */}
      {errorToast && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-700 rounded-2xl flex items-center gap-2.5 text-sm text-rose-900 dark:text-rose-200 shadow-md animate-in fade-in-50">
          <AlertCircle className="w-5 h-5 text-[#B22C22] shrink-0" />
          <span>{errorToast}</span>
        </div>
      )}

      {/* En-tête Plein Écran */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-6 sm:p-8 rounded-3xl shadow-card">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground font-display tracking-tight">
            Répertoire des Clients ({clients.length})
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Gérez vos fiches clients, coordonnées de facturation et suivez l'encours des créances en temps réel.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="text-xs sm:text-sm font-bold bg-[#FF6B00] hover:bg-[#EA580C] text-white shadow-md shadow-orange-500/20 px-5 py-3 h-auto rounded-xl"
        >
          <Plus className="w-4 h-4 mr-2" /> Nouveau Client
        </Button>
      </div>

      {/* Barre de Recherche */}
      <div className="max-w-md">
        <Input
          placeholder="Rechercher par nom, entreprise, téléphone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="w-4 h-4 text-muted-foreground" />}
          className="rounded-xl shadow-xs"
        />
      </div>

      {/* Grille des Cartes Clients */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[350px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF6B00]"></div>
        </div>
      ) : clients.length === 0 ? (
        <div className="bg-card border border-border rounded-3xl p-12 text-center space-y-4 shadow-card">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 text-[#FF6B00] flex items-center justify-center mx-auto">
            <Building className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Aucun client enregistré</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Créez votre premier compte client pour pouvoir émettre vos factures et suivre vos encaissements.
          </p>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#FF6B00] hover:bg-[#EA580C] text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-xs"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Ajouter un Premier Client
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {clients.map((client) => (
            <div
              key={client.id}
              className="bg-card border border-border rounded-2xl p-6 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between space-y-5 group relative"
            >
              <div className="space-y-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-foreground text-lg font-display group-hover:text-[#FF6B00] transition-colors">
                      {client.name}
                    </h3>
                    {client.companyName && (
                      <div className="text-xs text-[#0E7A55] font-bold flex items-center gap-1 mt-0.5">
                        <Building className="w-3.5 h-3.5" /> {client.companyName}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Bouton de Suppression */}
                    <button
                      type="button"
                      onClick={() => {
                        setClientToDelete(client);
                        setIsDeleteModalOpen(true);
                      }}
                      className="p-2 rounded-xl text-muted-foreground hover:text-[#B22C22] hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                      title="Supprimer ce client"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-[#FF6B00] font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-muted-foreground pt-3 border-t border-border">
                  {client.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{client.address}{client.city ? `, ${client.city}` : ''}</span>
                    </div>
                  )}
                  {client.taxIdNumber && (
                    <div className="text-[11px] font-mono bg-muted/40 px-2.5 py-1 rounded-md text-foreground font-semibold inline-block">
                      NIF/NINEA: {client.taxIdNumber}
                    </div>
                  )}
                </div>
              </div>

              {/* État financier & Action de facturation rapide */}
              <div className="space-y-3 pt-3 border-t border-border">
                <div className="bg-muted/30 p-3 rounded-xl flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-sans uppercase font-bold">Créance Dûe :</span>
                    <span className={`font-black text-sm ${client.outstandingBalance > 0 ? 'text-[#B22C22]' : 'text-[#0E7A55]'}`}>
                      {formatMoney(client.outstandingBalance || 0, currency)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground block font-sans uppercase font-bold">Total Facturé :</span>
                    <span className="font-extrabold text-foreground text-sm">
                      {formatMoney(client.totalInvoiced || 0, currency)}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/invoices/new?clientId=${client.id}`}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-[#FF6B00] text-xs font-bold transition-colors shadow-2xs"
                >
                  <FilePlus className="w-4 h-4" />
                  Créer une Facture pour ce Client
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modale d'Ajout d'un Nouveau Client */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Ajouter un Nouveau Client 👤"
        description="Renseignez les coordonnées de contact et fiscales du client pour vos factures."
      >
        <form onSubmit={handleCreateClient} className="space-y-4">
          <Input
            label="Nom du Contact Principal *"
            value={newClient.name}
            onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
            placeholder="ex: Mamadou Diallo"
            required
            className="rounded-xl shadow-2xs"
          />

          <Input
            label="Nom de l’Entreprise (Raison Sociale)"
            value={newClient.companyName}
            onChange={(e) => setNewClient({ ...newClient, companyName: e.target.value })}
            placeholder="ex: Sahel Logistique SARL (Optionnel)"
            className="rounded-xl shadow-2xs"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              type="email"
              label="Email de Contact"
              value={newClient.email}
              onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
              placeholder="contact@client.sn"
              className="rounded-xl shadow-2xs"
            />
            <Input
              label="Téléphone (avec indicatif) *"
              value={newClient.phone}
              onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
              placeholder="+221 77 000 00 00"
              required
              className="rounded-xl shadow-2xs"
            />
          </div>

          <Input
            label="Adresse & Siège"
            value={newClient.address}
            onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
            placeholder="ex: Rue 10 x Avenue Bourguiba"
            className="rounded-xl shadow-2xs"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Ville"
              value={newClient.city}
              onChange={(e) => setNewClient({ ...newClient, city: e.target.value })}
              className="rounded-xl shadow-2xs"
            />
            <Input
              label="Pays"
              value={newClient.country}
              onChange={(e) => setNewClient({ ...newClient, country: e.target.value })}
              className="rounded-xl shadow-2xs"
            />
          </div>

          <Input
            label="N° Fiscal (NINEA / IFU / RCCM)"
            value={newClient.taxIdNumber}
            onChange={(e) => setNewClient({ ...newClient, taxIdNumber: e.target.value })}
            placeholder="ex: SN-NINEA-00293810"
            className="rounded-xl shadow-2xs"
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              className="rounded-xl text-xs font-bold bg-[#FF6B00] hover:bg-[#EA580C] text-white shadow-md"
            >
              Enregistrer le Client
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modale de Confirmation de Suppression de Client */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setClientToDelete(null);
        }}
        title="Supprimer le Client 🗑️"
        description="Attention : confirmation de suppression définitive."
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-2xl flex items-start gap-2.5 text-xs text-rose-900 dark:text-rose-200">
            <AlertTriangle className="w-5 h-5 text-[#B22C22] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Action irréversible</p>
              <p className="mt-1 leading-relaxed">
                Êtes-vous sûr de vouloir supprimer définitivement le client <strong>« {clientToDelete?.name} »</strong> {clientToDelete?.companyName ? `(${clientToDelete.companyName})` : ''} ?
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setClientToDelete(null);
              }}
              className="rounded-xl text-xs"
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleDeleteClient}
              isLoading={isDeleting}
              className="rounded-xl text-xs font-bold bg-[#B22C22] hover:bg-[#8e231b] text-white shadow-md"
            >
              Supprimer Définitivement
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
