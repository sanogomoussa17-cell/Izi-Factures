'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Building2,
  Phone,
  Mail,
  Trash2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  MapPin,
} from 'lucide-react';
import { Supplier, Organization } from '@/core/domain/types';
import { repository } from '@/core/adapters';
import { formatMoney } from '@/core/domain/money';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Suppression Fournisseur
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toasts
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const [newSupplier, setNewSupplier] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    address: '',
    category: 'Fournitures & Services',
    taxIdNumber: '',
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [org, list] = await Promise.all([
        repository.getOrganization(),
        repository.getSuppliers(searchQuery),
      ]);
      setOrganization(org);
      setSuppliers(list || []);
    } catch (err) {
      console.error('Erreur chargement fournisseurs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery]);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplier.name.trim()) return;

    setIsSubmitting(true);
    setErrorToast(null);

    try {
      const created = await repository.createSupplier({
        ...newSupplier,
        name: newSupplier.name.trim(),
        companyName: newSupplier.companyName.trim(),
        orgId: organization?.id || 'a0000000-0000-0000-0000-000000000001',
      });

      setSuppliers((prev) => {
        const filtered = prev.filter((s) => s.id !== created.id && s.name.toLowerCase() !== created.name.toLowerCase());
        return [created, ...filtered];
      });

      setIsModalOpen(false);
      setSuccessToast(`Fournisseur « ${created.name} » ajouté avec succès.`);
      setTimeout(() => setSuccessToast(null), 5000);

      setNewSupplier({
        name: '',
        companyName: '',
        email: '',
        phone: '',
        address: '',
        category: 'Fournitures & Services',
        taxIdNumber: '',
      });

      // Rafraîchissement asynchrone
      repository.getSuppliers().then((fresh) => {
        if (fresh && fresh.length > 0) setSuppliers(fresh);
      });
    } catch (err: any) {
      console.error('Erreur création fournisseur:', err);
      setErrorToast(err?.message || "Erreur lors de l'enregistrement du fournisseur.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSupplier = async () => {
    if (!supplierToDelete) return;
    setIsDeleting(true);
    setErrorToast(null);

    try {
      await repository.deleteSupplier(supplierToDelete.id);
      setSuppliers((prev) => prev.filter((s) => s.id !== supplierToDelete.id));
      setSuccessToast(`Le fournisseur « ${supplierToDelete.name} » a été supprimé avec succès.`);
      setTimeout(() => setSuccessToast(null), 5000);
      setIsDeleteModalOpen(false);
      setSupplierToDelete(null);
    } catch (err: any) {
      console.error('Erreur suppression fournisseur:', err);
      setErrorToast(err?.message || 'Erreur lors de la suppression du fournisseur.');
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
            Fournisseurs & Dépenses ({suppliers.length})
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Gérez vos prestataires, achats professionnels et suivez vos décaissements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="text-xs font-bold rounded-xl"
            title="Rafraîchir"
          >
            <RefreshCw className="w-4 h-4 mr-1.5" /> Actualiser
          </Button>

          <Button
            onClick={() => setIsModalOpen(true)}
            className="text-xs sm:text-sm font-bold bg-[#FF6B00] hover:bg-[#EA580C] text-white shadow-md shadow-orange-500/20 px-5 py-3 h-auto rounded-xl"
          >
            <Plus className="w-4 h-4 mr-2" /> Nouveau Fournisseur
          </Button>
        </div>
      </div>

      {/* Barre de Recherche */}
      <div className="max-w-md">
        <Input
          placeholder="Rechercher par nom, entreprise, catégorie..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="w-4 h-4 text-muted-foreground" />}
          className="rounded-xl shadow-xs"
        />
      </div>

      {/* Grille des Fournisseurs */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[350px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF6B00]"></div>
        </div>
      ) : suppliers.length === 0 ? (
        <div className="bg-card border border-border rounded-3xl p-12 text-center space-y-4 shadow-card">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 text-[#FF6B00] flex items-center justify-center mx-auto">
            <Building2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Aucun fournisseur enregistré</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Ajoutez vos prestataires réguliers pour suivre vos coûts d'achats et factures de dépenses.
          </p>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#FF6B00] hover:bg-[#EA580C] text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-xs"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Ajouter un Premier Fournisseur
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {suppliers.map((sup) => (
            <div
              key={sup.id}
              className="bg-card border border-border rounded-2xl p-6 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between space-y-5 group relative"
            >
              <div className="space-y-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-foreground text-lg font-display group-hover:text-[#FF6B00] transition-colors">
                      {sup.name}
                    </h3>
                    {sup.companyName && (
                      <div className="text-xs text-[#0E7A55] font-bold flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3.5 h-3.5" /> {sup.companyName}
                      </div>
                    )}
                    <span className="inline-block mt-1 px-2.5 py-0.5 text-[10px] font-bold bg-orange-500/10 text-[#FF6B00] rounded-full uppercase tracking-wider">
                      {sup.category || 'Général'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Bouton de Suppression */}
                    <button
                      type="button"
                      onClick={() => {
                        setSupplierToDelete(sup);
                        setIsDeleteModalOpen(true);
                      }}
                      className="p-2 rounded-xl text-muted-foreground hover:text-[#B22C22] hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                      title="Supprimer ce fournisseur"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-[#FF6B00] font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
                      {sup.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-muted-foreground pt-3 border-t border-border">
                  {sup.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{sup.email}</span>
                    </div>
                  )}
                  {sup.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span>{sup.phone}</span>
                    </div>
                  )}
                  {sup.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{sup.address}{sup.city ? `, ${sup.city}` : ''}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* État financier */}
              <div className="pt-3 border-t border-border bg-muted/30 p-3 rounded-xl flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-[10px] text-muted-foreground block font-sans uppercase font-bold">Total Acheté :</span>
                  <span className="font-extrabold text-foreground text-sm">
                    {formatMoney(sup.totalPurchased || 0, currency)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground block font-sans uppercase font-bold">Reste Dû :</span>
                  <span className={`font-black text-sm ${sup.balanceDue > 0 ? 'text-[#B22C22]' : 'text-[#0E7A55]'}`}>
                    {formatMoney(sup.balanceDue || 0, currency)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modale d'Ajout d'un Nouveau Fournisseur */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Ajouter un Fournisseur 🏢"
        description="Enregistrez les coordonnées d'un prestataire ou fournisseur régulier."
      >
        <form onSubmit={handleCreateSupplier} className="space-y-4">
          <Input
            label="Nom du Contact / Commercial *"
            value={newSupplier.name}
            onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
            placeholder="ex: Alioune Badara"
            required
            className="rounded-xl shadow-2xs"
          />

          <Input
            label="Nom de l’Entreprise (Raison Sociale)"
            value={newSupplier.companyName}
            onChange={(e) => setNewSupplier({ ...newSupplier, companyName: e.target.value })}
            placeholder="ex: Sahel Matériaux SARL"
            className="rounded-xl shadow-2xs"
          />

          <Input
            label="Catégorie de Prestation / Dépense"
            value={newSupplier.category}
            onChange={(e) => setNewSupplier({ ...newSupplier, category: e.target.value })}
            placeholder="ex: Hébergement Web, Sous-traitance BTP, Fournitures"
            className="rounded-xl shadow-2xs"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              type="email"
              label="Email"
              value={newSupplier.email}
              onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
              placeholder="contact@fournisseur.sn"
              className="rounded-xl shadow-2xs"
            />
            <Input
              label="Téléphone"
              value={newSupplier.phone}
              onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
              placeholder="+221 77 123 45 67"
              className="rounded-xl shadow-2xs"
            />
          </div>

          <Input
            label="Adresse & Localisation"
            value={newSupplier.address}
            onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
            placeholder="ex: Zone Industrielle de Dakar"
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
              isLoading={isSubmitting}
              className="rounded-xl text-xs font-bold bg-[#FF6B00] hover:bg-[#EA580C] text-white shadow-md"
            >
              Enregistrer le Fournisseur
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modale de Confirmation de Suppression de Fournisseur */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSupplierToDelete(null);
        }}
        title="Supprimer le Fournisseur 🗑️"
        description="Attention : confirmation de suppression définitive."
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-2xl flex items-start gap-2.5 text-xs text-rose-900 dark:text-rose-200">
            <AlertTriangle className="w-5 h-5 text-[#B22C22] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Action irréversible</p>
              <p className="mt-1 leading-relaxed">
                Êtes-vous sûr de vouloir supprimer définitivement le fournisseur{' '}
                <strong>« {supplierToDelete?.name} »</strong> {supplierToDelete?.companyName ? `(${supplierToDelete.companyName})` : ''} ?
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSupplierToDelete(null);
              }}
              className="rounded-xl text-xs"
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleDeleteSupplier}
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
