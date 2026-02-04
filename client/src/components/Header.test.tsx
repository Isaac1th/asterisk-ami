import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Header } from './Header';

describe('Header', () => {
  const defaultProps = {
    isConnected: true,
    amiStatus: { connected: true },
    onRefresh: vi.fn(),
  };

  it('should render the title', () => {
    render(<Header {...defaultProps} />);

    expect(screen.getByText('Asterisk Live Monitor')).toBeInTheDocument();
  });

  it('should show connected state when both socket and AMI are connected', () => {
    render(<Header {...defaultProps} />);

    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByText('AMI & Socket active')).toBeInTheDocument();
  });

  it('should show partial state when socket is connected but AMI is not', () => {
    render(
      <Header
        isConnected={true}
        amiStatus={{ connected: false }}
        onRefresh={vi.fn()}
      />
    );

    expect(screen.getByText('AMI Disconnected')).toBeInTheDocument();
    expect(screen.getByText('Socket OK, waiting for AMI...')).toBeInTheDocument();
  });

  it('should show disconnected state when socket is not connected', () => {
    render(
      <Header
        isConnected={false}
        amiStatus={{ connected: false }}
        onRefresh={vi.fn()}
      />
    );

    expect(screen.getByText('Disconnected')).toBeInTheDocument();
    expect(screen.getByText('Connecting to server...')).toBeInTheDocument();
  });

  it('should call onRefresh when refresh button is clicked', () => {
    const onRefresh = vi.fn();
    render(<Header {...defaultProps} onRefresh={onRefresh} />);

    fireEvent.click(screen.getByText('Refresh'));

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('should have correct CSS class for connection state', () => {
    const { container } = render(<Header {...defaultProps} />);

    expect(container.querySelector('.connection-status')).toHaveClass('connected');
  });

  it('should have correct CSS class for partial connection state', () => {
    const { container } = render(
      <Header
        isConnected={true}
        amiStatus={{ connected: false }}
        onRefresh={vi.fn()}
      />
    );

    expect(container.querySelector('.connection-status')).toHaveClass('partial');
  });
});
