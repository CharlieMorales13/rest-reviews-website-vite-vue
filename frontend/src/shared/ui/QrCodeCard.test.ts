import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import QrCodeCard from './QrCodeCard.vue';

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

  it('displays the QR link URL containing the slug', () => {
    const wrapper = mount(QrCodeCard, {
      props: { slug: 'cuckoo-box', establishmentName: 'Cuckoo Box' },
    });
    expect(wrapper.find('.font-mono').text()).toContain('/r/cuckoo-box');
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

  it('URL in chip uses window.location.origin as base', () => {
    const wrapper = mount(QrCodeCard, {
      props: { slug: 'cuckoo-coffee', establishmentName: 'Cuckoo Coffee' },
    });
    const chipText = wrapper.find('.font-mono').text();
    expect(chipText).toMatch(/^https?:\/\/.+\/r\/cuckoo-coffee$/);
  });
});
