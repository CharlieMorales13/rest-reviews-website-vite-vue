import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import QrCodeCard from './QrCodeCard.vue';
import QRCodeStyling from 'qr-code-styling';

const mockQrInstance = {
  append: vi.fn(),
  download: vi.fn().mockResolvedValue(undefined),
  update: vi.fn(),
};

// Arrow functions cannot be used as constructors — use regular function
vi.mock('qr-code-styling', () => ({
  default: vi.fn(function () { return mockQrInstance; }),
}));

describe('QrCodeCard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the card header with QR title', () => {
    const wrapper = mount(QrCodeCard, {
      props: { slug: 'cuckoo-box', establishmentName: 'Cuckoo Box' },
    });
    expect(wrapper.text()).toContain('Tu QR de Reseñas');
  });

  it('shows the download PNG button', () => {
    const wrapper = mount(QrCodeCard, {
      props: { slug: 'cuckoo-box', establishmentName: 'Cuckoo Box' },
    });
    expect(wrapper.text()).toContain('Descargar PNG');
  });

  it('calls qrCode.download with slug-based filename when button is clicked', async () => {
    const wrapper = mount(QrCodeCard, {
      props: { slug: 'delyfull', establishmentName: 'DelyFull' },
    });
    await wrapper.find('button').trigger('click');
    expect(mockQrInstance.download).toHaveBeenCalledWith({
      name: 'qr-delyfull',
      extension: 'png',
    });
  });

  it('appends QR to the container on mount', async () => {
    mount(QrCodeCard, {
      props: { slug: 'guajaquenito', establishmentName: 'Guajaquenito' },
    });
    await new Promise(r => setTimeout(r, 10));
    expect(mockQrInstance.append).toHaveBeenCalled();
  });

  it('passes the correct QR URL data including slug to qr-code-styling', () => {
    mount(QrCodeCard, {
      props: { slug: 'cuckoo-coffee', establishmentName: 'Cuckoo Coffee' },
    });
    const callArg = vi.mocked(QRCodeStyling).mock.calls.at(-1)?.[0] as { data?: string } | undefined;
    expect(callArg?.data).toMatch(/\/r\/cuckoo-coffee$/);
  });
});
