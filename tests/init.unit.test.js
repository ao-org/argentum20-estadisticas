import { describe, it, expect, beforeEach, vi } from 'vitest';

// Set up the AO20 namespace with stubs before requiring init.js
globalThis.AO20 = {
  navigation: {
    init: vi.fn()
  },
  renderers: {
    initStaticCharts: vi.fn(),
    renderGoldInflationChart: vi.fn(),
    renderItemsChart: vi.fn()
  }
};

const { initApp } = require('../js/init.js');

describe('js/init.js — DOMContentLoaded orchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports an initApp function', () => {
    expect(typeof initApp).toBe('function');
  });

  it('calls AO20.navigation.init()', () => {
    initApp();
    expect(AO20.navigation.init).toHaveBeenCalledTimes(1);
  });

  it('calls AO20.renderers.initStaticCharts()', () => {
    initApp();
    expect(AO20.renderers.initStaticCharts).toHaveBeenCalledTimes(1);
  });

  it('calls AO20.renderers.renderGoldInflationChart with "goldInflation"', () => {
    initApp();
    expect(AO20.renderers.renderGoldInflationChart).toHaveBeenCalledWith('goldInflation');
  });

  it('calls AO20.renderers.renderItemsChart with "itemsQuantity"', () => {
    initApp();
    expect(AO20.renderers.renderItemsChart).toHaveBeenCalledWith('itemsQuantity');
  });

  it('calls all four init functions in order', () => {
    var callOrder = [];
    AO20.navigation.init.mockImplementation(() => callOrder.push('nav'));
    AO20.renderers.initStaticCharts.mockImplementation(() => callOrder.push('static'));
    AO20.renderers.renderGoldInflationChart.mockImplementation(() => callOrder.push('gold'));
    AO20.renderers.renderItemsChart.mockImplementation(() => callOrder.push('items'));

    initApp();

    expect(callOrder).toEqual(['nav', 'static', 'gold', 'items']);
  });
});
