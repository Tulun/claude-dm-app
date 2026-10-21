import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ItemDetailModal from '../../app/combat/components/ItemDetailModal';

describe('ItemDetailModal armor', () => {
  it('shows base AC and DEX rule for armor with an empty description', () => {
    render(
      <ItemDetailModal
        item={{ id: 1, name: 'Leather Armour', itemType: 'armor', baseAC: '11', armorType: 'Light', description: '' }}
        stats={null}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('Base AC')).toBeInTheDocument();
    expect(screen.getByText('11')).toBeInTheDocument();
    expect(screen.getByText('AC + full DEX')).toBeInTheDocument();
    expect(screen.queryByText('No description.')).not.toBeInTheDocument();
  });

  it('shows the wearer\'s AC as base + DEX when given a character', () => {
    render(
      <ItemDetailModal
        item={{ id: 1, name: 'Leather Armour', itemType: 'armor', baseAC: '11', armorType: 'Light' }}
        character={{ dex: 16 }}
        stats={null}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('14')).toBeInTheDocument();
    expect(screen.getByText('11 AC + Dex Modifier (+3)')).toBeInTheDocument();
  });

  it('caps DEX at +2 for medium armor', () => {
    render(
      <ItemDetailModal
        item={{ id: 4, name: 'Breastplate', itemType: 'armor', baseAC: '14', armorType: 'Medium' }}
        character={{ dex: 18 }}
        stats={null}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('16')).toBeInTheDocument();
    expect(screen.getByText('14 AC + Dex Modifier (+2)')).toBeInTheDocument();
  });

  it('falls back to the armor table when the item has no baseAC', () => {
    render(<ItemDetailModal item={{ id: 2, name: 'Chain Mail', itemType: 'armor', stealthDisadv: true }} stats={null} onClose={vi.fn()} />);
    expect(screen.getByText('16')).toBeInTheDocument();
    expect(screen.getByText('AC only')).toBeInTheDocument();
    expect(screen.getByText('Disadvantage on Stealth checks')).toBeInTheDocument();
  });

  it('still says "No description." for plain gear', () => {
    render(<ItemDetailModal item={{ id: 3, name: 'Rope' }} stats={null} onClose={vi.fn()} />);
    expect(screen.getByText('No description.')).toBeInTheDocument();
  });
});
