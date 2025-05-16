'use client';

import { useState, useEffect } from 'react';

export function useUserRole() {
  const [userRole, setUserRole] = useState<string>('visualizador');

  useEffect(() => {
    // Só executa no cliente
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('userRole') || 'visualizador';
      setUserRole(role);
    }
  }, []);

  return userRole;
} 