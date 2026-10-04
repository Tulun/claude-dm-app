'use client';

import QuickActionsModal from './QuickActionsModal';
import QuickResourcesModal from './QuickResourcesModal';
import CharacterSheetModal from './CharacterSheetModal';
import InventoryModal from './InventoryModal';
import NotesModal from './NotesModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import StatBlockModal from './StatBlockModal';
import SpellsModal from './SpellsModal';
import DruidFeaturesModal from './DruidFeaturesModal';
import SorcererFeaturesModal from './SorcererFeaturesModal';

/**
 * Every combatant modal, driven by ONE `activeModal` key ('delete' |
 * 'actions' | 'resources' | 'sheet' | 'inventory' | 'notes' | 'statblock' |
 * 'spells' | 'druid' | 'sorcerer'; null = closed). Shared by CharacterCard
 * and the turn tracker's Now card — add new combatant modals here.
 */
export default function CardModals({ activeModal, onClose, character, isEnemy, onUpdate, onRemove, templates, displayAC, spellcastingInfo }) {
  return (
    <>
      <DeleteConfirmModal isOpen={activeModal === 'delete'} onClose={onClose} character={character} isEnemy={isEnemy} onRemove={onRemove} />
      <QuickActionsModal isOpen={activeModal === 'actions'} onClose={onClose} character={character} onUpdate={onUpdate} displayAC={displayAC} spellcastingInfo={spellcastingInfo} />
      <QuickResourcesModal isOpen={activeModal === 'resources'} onClose={onClose} character={character} onUpdate={onUpdate} templates={templates} />
      <CharacterSheetModal isOpen={activeModal === 'sheet'} onClose={onClose} character={character} />
      <InventoryModal isOpen={activeModal === 'inventory'} onClose={onClose} character={character} onUpdate={onUpdate} />
      <NotesModal isOpen={activeModal === 'notes'} onClose={onClose} character={character} onUpdate={onUpdate} />
      <StatBlockModal isOpen={activeModal === 'statblock'} onClose={onClose} character={character} />
      <SpellsModal isOpen={activeModal === 'spells'} onClose={onClose} character={character} />
      <DruidFeaturesModal isOpen={activeModal === 'druid'} onClose={onClose} character={character} onUpdate={onUpdate} />
      <SorcererFeaturesModal isOpen={activeModal === 'sorcerer'} onClose={onClose} character={character} onUpdate={onUpdate} />
    </>
  );
}
