export const getThemeColors = (theme) => {
  if (theme === 'dark') {
    return {
      bgPrimary: '#0f0f1e',
      bgSecondary: 'rgba(22, 22, 42, 0.98)',
      bgCard: 'rgba(30, 30, 56, 0.7)',
      bgInput: 'rgba(15, 15, 30, 0.6)',
      textPrimary: '#f1f5f9',
      textSecondary: '#94a3b8',
      textMuted: '#64748b',
      border: 'rgba(255,255,255,0.08)',
      borderHover: 'rgba(255,255,255,0.15)'
    };
  } else {
    return {
      bgPrimary: '#f0f4f8',
      bgSecondary: '#ffffff',
      bgCard: 'rgba(255, 255, 255, 0.95)',
      bgInput: '#f8fafc',
      textPrimary: '#1e293b',
      textSecondary: '#475569',
      textMuted: '#64748b',
      border: 'rgba(0,0,0,0.1)',
      borderHover: 'rgba(0,0,0,0.2)'
    };
  }
};
