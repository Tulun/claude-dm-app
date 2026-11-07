import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';

const push = vi.fn();
let params = new URLSearchParams('type=dm-npc');

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }) => <a href={href} {...props}>{children}</a>,
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => params,
  usePathname: () => '/characters/new',
}));

import NewCharacterPage from '../../app/characters/new/page.jsx';

const existingNpcs = [{ id: 'dm-npc-1', name: 'Bartender Olm', class: 'Commoner', level: 1, maxHp: 12, currentHp: 12, isDmNpc: true }];
const existingParty = [{ id: 'p1', name: 'Theren', class: 'Ranger', level: 5 }];

const spell = (id, name, level, classes = ['Cleric']) => ({ id, name, level, classes, school: 'Evocation', castingTime: 'Action', range: '60 feet', components: 'V', duration: 'Instantaneous', description: `${name} text` });
const spellbook = [
  spell('spell-guidance', 'Guidance', 0), spell('spell-light', 'Light', 0), spell('spell-thaumaturgy', 'Thaumaturgy', 0),
  spell('spell-sacred-flame', 'Sacred Flame', 0),
  spell('spell-bless', 'Bless', 1), spell('spell-cure-wounds', 'Cure Wounds', 1), spell('spell-guiding-bolt', 'Guiding Bolt', 1),
  spell('spell-healing-word', 'Healing Word', 1), spell('spell-shield-of-faith', 'Shield of Faith', 1),
  spell('spell-spiritual-weapon', 'Spiritual Weapon', 2), // above a level-1 cleric's reach
  spell('spell-fire-bolt', 'Fire Bolt', 0, ['Wizard']),
];

const jsonResponse = (data, ok = true, status = 200) => ({ ok, status, json: async () => data });

function mockFetch({ getOk = true } = {}) {
  const fn = vi.fn(async (url, opts = {}) => {
    if (opts.method === 'POST') return jsonResponse({ success: true });
    if (!getOk) return jsonResponse(null, false, 500);
    if (url === '/api/party') return jsonResponse(existingParty);
    if (url === '/api/dm-npcs') return jsonResponse(existingNpcs);
    if (url === '/api/spells') return jsonResponse(spellbook);
    return jsonResponse(null);
  });
  global.fetch = fn;
  return fn;
}

const posted = (fetchMock, url) => {
  const call = fetchMock.mock.calls.find(([u, o]) => u === url && o?.method === 'POST');
  return call ? JSON.parse(call[1].body) : null;
};

const flush = () => act(async () => {});
const createButton = () => screen.getByRole('button', { name: 'Create now' });

beforeEach(() => {
  push.mockClear();
  params = new URLSearchParams('type=dm-npc');
});
afterEach(() => vi.restoreAllMocks());

describe('/characters/new', () => {
  it('renders as a page (no modal) with the builder steps (no Spells step for a non-caster)', () => {
    mockFetch();
    render(<NewCharacterPage />);
    expect(screen.getByRole('heading', { name: /New DM NPC/ })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const steps = screen.getByRole('navigation', { name: 'Steps' });
    for (const label of ['Basics', 'Class', 'Background', 'Species', 'Abilities', 'Equipment', 'Resources', 'Details', 'Review']) {
      expect(steps).toHaveTextContent(label);
    }
    expect(steps).not.toHaveTextContent('Spells');
  });

  it('quick-creates an NPC from just a name, appending to the list and opening its sheet', async () => {
    const fetchMock = mockFetch();
    render(<NewCharacterPage />);

    expect(createButton()).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Name *'), { target: { value: 'Captain Reva' } });
    fireEvent.click(createButton());
    await flush();

    const saved = posted(fetchMock, '/api/dm-npcs');
    expect(saved).toHaveLength(2);
    expect(saved[0]).toEqual(existingNpcs[0]);
    expect(saved[1]).toMatchObject({ name: 'Captain Reva', class: 'Fighter', level: 1, isDmNpc: true, initiative: 0 });
    expect(saved[1].currentHp).toBe(saved[1].maxHp);
    expect(push).toHaveBeenCalledWith(`/character?id=${encodeURIComponent(saved[1].id)}&type=dm-npc`);
  });

  it('creates party members on /api/party when type=party', async () => {
    params = new URLSearchParams('type=party');
    const fetchMock = mockFetch();
    render(<NewCharacterPage />);
    expect(screen.getByRole('heading', { name: /New Party Member/ })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Name *'), { target: { value: 'Pip' } });
    fireEvent.click(createButton());
    await flush();

    const saved = posted(fetchMock, '/api/party');
    expect(saved.map(p => p.name)).toEqual(['Theren', 'Pip']);
    expect(saved[1].id).toMatch(/^party-/);
    expect(saved[1].isDmNpc).toBeUndefined();
    expect(posted(fetchMock, '/api/dm-npcs')).toBeNull();
  });

  it('writes nothing when the current list cannot be read', async () => {
    const fetchMock = mockFetch({ getOk: false });
    render(<NewCharacterPage />);
    fireEvent.change(screen.getByLabelText('Name *'), { target: { value: 'Reva' } });
    fireEvent.click(createButton());
    await flush();

    expect(posted(fetchMock, '/api/dm-npcs')).toBeNull();
    expect(screen.getByRole('alert')).toHaveTextContent(/nothing was saved/);
    expect(push).not.toHaveBeenCalled();
  });

  it('walks every step to build a full NPC', async () => {
    const fetchMock = mockFetch();
    render(<NewCharacterPage />);

    fireEvent.change(screen.getByLabelText('Name *'), { target: { value: 'Sister Ama' } });
    fireEvent.click(screen.getByText('Next: Class'));

    fireEvent.click(screen.getByRole('button', { name: /Cleric/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Medicine' }));
    fireEvent.click(screen.getByRole('button', { name: 'History' }));
    fireEvent.click(screen.getByText('Next: Spells'));

    // Level-1 Cleric: 3 cantrips, 4 prepared, nothing above 1st level, Cleric list only
    await flush();
    expect(screen.queryByText('Spiritual Weapon')).not.toBeInTheDocument();
    expect(screen.queryByText('Fire Bolt')).not.toBeInTheDocument();
    for (const name of ['Guidance', 'Light', 'Sacred Flame', 'Bless', 'Cure Wounds', 'Guiding Bolt', 'Healing Word']) {
      fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${name}`) }));
    }
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
    expect(screen.getByText('4 / 4')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Next: Background'));

    fireEvent.click(screen.getByRole('button', { name: /Acolyte/ }));
    fireEvent.change(screen.getByLabelText('+2 to'), { target: { value: 'wis' } });
    fireEvent.change(screen.getByLabelText('+1 to'), { target: { value: 'cha' } });
    fireEvent.click(screen.getByText('Next: Species'));

    fireEvent.click(screen.getByRole('button', { name: /Dwarf/ }));
    fireEvent.click(screen.getByText('Next: Abilities'));

    const assign = { Strength: 13, Dexterity: 8, Constitution: 14, Intelligence: 10, Wisdom: 15, Charisma: 12 };
    for (const [ability, value] of Object.entries(assign)) {
      fireEvent.change(screen.getByLabelText(`${ability} score`), { target: { value: String(value) } });
    }
    fireEvent.click(screen.getByText('Next: Equipment'));
    fireEvent.click(screen.getByText('Next: Resources'));

    // Defaults: cleric slots + dwarf Stonecunning; adjust one, add a custom one
    expect(screen.getByDisplayValue('1st Level Spell Slots')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Stonecunning uses'), { target: { value: '3' } });
    fireEvent.click(screen.getByText('+ Add resource'));
    const names = screen.getAllByLabelText('Resource name');
    fireEvent.change(names[names.length - 1], { target: { value: 'Temple Favors' } });
    fireEvent.click(screen.getByText('Next: Details'));
    fireEvent.click(screen.getByRole('button', { name: 'Dwarvish' }));
    fireEvent.click(screen.getByRole('button', { name: 'Celestial' }));
    fireEvent.click(screen.getByText('Next: Review'));

    // Divine Order is the only open choice left
    expect(screen.getByText(/Choose an option for Divine Order/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('Create NPC'));
    await flush();

    const ama = posted(fetchMock, '/api/dm-npcs').find((n) => n.name === 'Sister Ama');
    expect(ama).toMatchObject({
      class: 'Cleric', race: 'Dwarf', background: 'Acolyte', wis: 17, cha: 13, con: 14,
      spellStat: 'wis', languages: 'Common, Dwarvish, Celestial', isDmNpc: true,
      saveProficiencies: { wis: 1, cha: 1 },
      skillProficiencies: { Insight: 1, Religion: 1, Medicine: 1, History: 1 },
      maxHp: 8 + 2 + 1, // d8 + CON +2 + Dwarven Toughness
      ac: 13 - 1 + 2, // chain shirt + DEX 8 (−1) + shield
    });
    expect(ama.spells.map(sp => sp.name)).toEqual(['Guidance', 'Light', 'Sacred Flame', 'Bless', 'Cure Wounds', 'Guiding Bolt', 'Healing Word']);
    expect(ama.spells[0]).toMatchObject({ sourceId: 'spell-guidance', castTime: 'Action', prepared: true, spellClass: 'Cleric' });
    expect(ama.spells[0].castingTime).toBeUndefined();
    expect(ama.resources.map(r => [r.name, r.max, r.current])).toEqual([
      ['1st Level Spell Slots', 2, 2],
      ['Stonecunning', 3, 3],
      ['Temple Favors', 1, 1],
    ]);
  });

  it('multiclassing into a caster adds the Spells step for that class and its resources', async () => {
    const fetchMock = mockFetch();
    render(<NewCharacterPage />);
    fireEvent.change(screen.getByLabelText('Name *'), { target: { value: 'Gish' } });
    fireEvent.click(screen.getByText('Next: Class'));
    // Fighter (default) level 2, then add Wizard 1
    fireEvent.change(screen.getByLabelText('Fighter level'), { target: { value: '2' } });
    expect(screen.queryByText('Next: Spells')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('+ Add a class'));
    fireEvent.change(screen.getByLabelText('Class', { selector: 'select' }), { target: { value: 'Wizard' } });
    expect(screen.getByText(/requires INT 13/)).toBeInTheDocument();
    expect(screen.getByText('Character level 3 / 20')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Next: Spells'));
    await flush();
    expect(screen.getByText('Wizard 1')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^Fire Bolt/ }));
    expect(screen.queryByText('Guidance')).not.toBeInTheDocument(); // Cleric-only

    fireEvent.click(screen.getByRole('button', { name: /Resources$/ }));
    for (const name of ['Second Wind', 'Action Surge', 'Arcane Recovery', '1st Level Spell Slots']) {
      expect(screen.getByDisplayValue(name)).toBeInTheDocument();
    }
    fireEvent.click(createButton());
    await flush();
    const gish = posted(fetchMock, '/api/dm-npcs').find(n => n.name === 'Gish');
    expect(gish).toMatchObject({ level: 3, classes: [{ name: 'Fighter', level: 2 }, { name: 'Wizard', level: 1 }], spellStat: 'int' });
    expect(gish.spells.map(sp => sp.name)).toEqual(['Fire Bolt']);
  });

  it('removing the only caster class removes the Spells step', () => {
    mockFetch();
    render(<NewCharacterPage />);
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Steps' })).getByRole('button', { name: /Class$/ }));
    fireEvent.click(screen.getByText('+ Add a class'));
    fireEvent.change(screen.getByLabelText('Class', { selector: 'select' }), { target: { value: 'Wizard' } });
    expect(screen.getByRole('navigation', { name: 'Steps' })).toHaveTextContent('Spells');
    fireEvent.click(screen.getByLabelText('Remove Wizard multiclass'));
    expect(screen.getByRole('navigation', { name: 'Steps' })).not.toHaveTextContent('Spells');
  });

  it('asks before discarding a half-built character on Cancel', () => {
    mockFetch();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<NewCharacterPage />);

    fireEvent.change(screen.getByLabelText('Name *'), { target: { value: 'Half done' } });
    fireEvent.click(screen.getByText('Cancel'));
    expect(confirm).toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();

    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByText('Cancel'));
    expect(push).toHaveBeenCalledWith('/characters');
  });

  it('cancels straight away when nothing was entered', () => {
    mockFetch();
    const confirm = vi.spyOn(window, 'confirm');
    render(<NewCharacterPage />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(confirm).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith('/characters');
  });
});
