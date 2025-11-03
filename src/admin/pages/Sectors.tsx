import React, { useState } from 'react';
import { useSectors, useCreateSector, useUpdateSector, useDeleteSector } from '../hooks/useSectors';
import { LoadingSpinner, ErrorMessage } from '../components/common/LoadingSpinner';
import SectorCard from '../components/sectors/SectorCard';
import SectorModal from '../components/sectors/SectorModal';
import DeleteConfirmModal from '../components/common/DeleteConfirmModal';
import { Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { Sector, SectorFormData } from '../types/sector.types';

/**
 * Page de gestion des secteurs d'activité
 * 
 * Architecture:
 * - Affichage en grid de cards pour chaque secteur
 * - Modal de création/édition réutilisable
 * - Modal de confirmation pour la suppression
 * - Gestion d'états pour les modals et le secteur en cours d'édition
 * 
 * Fonctionnalités:
 * - Liste de tous les secteurs avec image, icône et description
 * - Création de nouveaux secteurs avec formulaire complet
 * - Édition des secteurs existants
 * - Suppression avec confirmation
 * - Feedback utilisateur via toasts
 */

const Sectors: React.FC = () => {
  // Hooks React Query pour les données et mutations
  const { data: sectors, isLoading, error } = useSectors();
  const createMutation = useCreateSector();
  const updateMutation = useUpdateSector();
  const deleteMutation = useDeleteSector();

  // États pour la gestion des modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingSector, setEditingSector] = useState<Sector | null>(null);
  const [deletingSector, setDeletingSector] = useState<Sector | null>(null);

  /**
   * Ouvre le modal de création d'un nouveau secteur
   * Réinitialise editingSector à null pour indiquer une création
   */
  const handleCreate = () => {
    setEditingSector(null);
    setIsModalOpen(true);
  };

  /**
   * Ouvre le modal d'édition pour un secteur spécifique
   * Le secteur est passé en props au modal qui pré-remplit le formulaire
   * 
   * @param sector - Le secteur à éditer
   */
  const handleEdit = (sector: Sector) => {
    setEditingSector(sector);
    setIsModalOpen(true);
  };

  /**
   * Ouvre le modal de confirmation de suppression
   * 
   * @param sector - Le secteur à supprimer
   */
  const handleDeleteClick = (sector: Sector) => {
    setDeletingSector(sector);
    setIsDeleteModalOpen(true);
  };

  /**
   * Soumet le formulaire de création ou de mise à jour
   * Convertit les données du formulaire vers le format attendu par l'API
   * 
   * @param formData - Données du formulaire avec champs dépliés
   */
  const handleSubmit = async (formData: SectorFormData) => {
    try {
      // Construction du content_modal à partir des champs du formulaire
      const content_modal = {
        hero_title: formData.hero_title,
        hero_subtitle: formData.hero_subtitle,
        description: formData.modal_description,
        highlights: formData.highlights,
        tech_stack: formData.tech_stack,
        case_study: {
          title: formData.case_study_title,
          results: formData.case_study_results,
        },
        cta_text: formData.cta_text,
      };

      // Données du secteur au format API
      const sectorData = {
        id: formData.id,
        title: formData.title,
        description: formData.description,
        services: formData.services,
        icon: formData.icon,
        image: formData.image,
        content_modal,
      };

      if (editingSector) {
        // Mode édition - Mise à jour du secteur existant
        await updateMutation.mutateAsync({
          id: editingSector.id,
          data: sectorData,
        });
        toast.success('Secteur mis à jour avec succès !');
      } else {
        // Mode création - Nouveau secteur
        await createMutation.mutateAsync(sectorData);
        toast.success('Secteur créé avec succès !');
      }

      setIsModalOpen(false);
      setEditingSector(null);
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde du secteur:', error);
      
      // Messages d'erreur personnalisés selon le type d'erreur
      if (error.code === '23505') {
        // Code PostgreSQL pour violation de contrainte unique
        toast.error('Un secteur avec cet ID existe déjà.');
      } else {
        toast.error(
          editingSector
            ? 'Erreur lors de la mise à jour du secteur.'
            : 'Erreur lors de la création du secteur.'
        );
      }
    }
  };

  /**
   * Confirme et exécute la suppression d'un secteur
   */
  const handleConfirmDelete = async () => {
    if (!deletingSector) return;

    try {
      await deleteMutation.mutateAsync(deletingSector.id);
      toast.success('Secteur supprimé avec succès !');
      setIsDeleteModalOpen(false);
      setDeletingSector(null);
    } catch (error) {
      console.error('Erreur lors de la suppression du secteur:', error);
      toast.error('Erreur lors de la suppression du secteur.');
    }
  };

  /**
   * Ferme le modal de création/édition et réinitialise l'état
   */
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSector(null);
  };

  /**
   * Ferme le modal de suppression et réinitialise l'état
   */
  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingSector(null);
  };

  // Gestion de l'état de chargement
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Chargement des secteurs..." />
      </div>
    );
  }

  // Gestion des erreurs
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent mb-2">
            Secteurs d'activité
          </h1>
          <p className="text-gray-400">Gérez les secteurs d'activité de votre portfolio</p>
        </div>
        <ErrorMessage
          title="Erreur de chargement"
          message="Impossible de charger les secteurs. Vérifiez votre connexion."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec titre et bouton de création */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent mb-2">
            Secteurs d'activité
          </h1>
          <p className="text-gray-400">
            Gérez les secteurs d'activité de votre portfolio ({sectors?.length || 0} secteur
            {(sectors?.length || 0) > 1 ? 's' : ''})
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-lg transition-all duration-200 shadow-lg shadow-pink-500/20"
        >
          <Plus size={20} />
          Nouveau secteur
        </button>
      </div>

      {/* Message si aucun secteur */}
      {!sectors || sectors.length === 0 ? (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-pink-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus size={32} className="text-pink-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-200 mb-2">Aucun secteur</h3>
            <p className="text-gray-400 mb-6">
              Commencez par créer votre premier secteur d'activité pour présenter vos domaines
              d'expertise à vos clients.
            </p>
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-lg transition-all duration-200"
            >
              <Plus size={20} />
              Créer mon premier secteur
            </button>
          </div>
        </div>
      ) : (
        /* Grid de cards des secteurs */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sectors.map((sector) => (
            <SectorCard
              key={sector.id}
              sector={sector}
              onEdit={() => handleEdit(sector)}
              onDelete={() => handleDeleteClick(sector)}
            />
          ))}
        </div>
      )}

      {/* Modal de création/édition */}
      {isModalOpen && (
        <SectorModal
          sector={editingSector}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* Modal de confirmation de suppression */}
      {isDeleteModalOpen && deletingSector && (
        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={handleCloseDeleteModal}
          onConfirm={handleConfirmDelete}
          title="Supprimer le secteur"
          message={`Êtes-vous sûr de vouloir supprimer le secteur "${deletingSector.title}" ? Cette action est irréversible.`}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
};

export default Sectors;
