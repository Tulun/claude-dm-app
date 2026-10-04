import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Modal from '../../app/components/Modal.jsx';

const esc = () => fireEvent.keyDown(document, { key: 'Escape' });

describe('Modal — Escape', () => {
  it('closes on Escape', () => {
    const onClose = vi.fn();
    render(<Modal onClose={onClose}><div>panel</div></Modal>);
    esc();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ignores other keys', () => {
    const onClose = vi.fn();
    render(<Modal onClose={onClose}><div>panel</div></Modal>);
    fireEvent.keyDown(document, { key: 'Enter' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('only the topmost of stacked modals closes', () => {
    const base = vi.fn();
    const raised = vi.fn();
    const { rerender } = render(<Modal onClose={base}><div>base</div></Modal>);
    rerender(
      <>
        <Modal onClose={base}><div>base</div></Modal>
        <Modal onClose={raised} layer="raised"><div>raised</div></Modal>
      </>
    );
    esc();
    expect(raised).toHaveBeenCalledTimes(1);
    expect(base).not.toHaveBeenCalled();

    // once the top one is gone, the next Escape reaches the one beneath
    rerender(<Modal onClose={base}><div>base</div></Modal>);
    esc();
    expect(base).toHaveBeenCalledTimes(1);
  });

  it('a modal without onClose stays open and still shields the one beneath', () => {
    const base = vi.fn();
    render(
      <>
        <Modal onClose={base}><div>base</div></Modal>
        <Modal layer="raised"><div>locked</div></Modal>
      </>
    );
    esc();
    expect(base).not.toHaveBeenCalled();
    expect(screen.getByText('locked')).toBeInTheDocument();
  });

  it('a handler that preventDefaults Escape keeps the modal open', () => {
    const onClose = vi.fn();
    render(
      <Modal onClose={onClose}>
        <input aria-label="field" onKeyDown={(e) => { if (e.key === 'Escape') e.preventDefault(); }} />
      </Modal>
    );
    fireEvent.keyDown(screen.getByLabelText('field'), { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closed modals do not listen', () => {
    const onClose = vi.fn();
    render(<Modal isOpen={false} onClose={onClose}><div>panel</div></Modal>);
    esc();
    expect(onClose).not.toHaveBeenCalled();
  });
});
