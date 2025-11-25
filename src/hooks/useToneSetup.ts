import { useState, useEffect } from 'react';

export const useToneSetup = () => {
  const [showToneModal, setShowToneModal] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Check if needs tone setup after 3 seconds, but only if user hasn't clicked "Fazer mais tarde"
    const timer = setTimeout(() => {
      const needsToneSetup = localStorage.getItem('needs_tone_setup');
      const postponed = localStorage.getItem('tone_setup_postponed');
      console.log('🔍 Verificando needs_tone_setup:', { needsToneSetup, postponed, hasChecked });
      
      // Only show automatically if not postponed and hasn't been checked yet
      if (needsToneSetup === 'true' && !postponed && !hasChecked) {
        console.log('✅ Mostrando modal de configuração de tom automaticamente');
        setShowToneModal(true);
        setHasChecked(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [hasChecked]);

  const checkToneSetupBeforeAction = (action: () => void) => {
    const needsToneSetup = localStorage.getItem('needs_tone_setup');
    console.log('🔍 Verificando antes da ação:', { needsToneSetup, currentShowToneModal: showToneModal });
    if (needsToneSetup === 'true') {
      console.log('🚫 Bloqueando ação - mostrando modal de tom');
      setShowToneModal(true);
      console.log('✅ setShowToneModal(true) chamado');
      return false; // Return false to indicate action was blocked
    }
    action();
    return true; // Return true to indicate action proceeded
  };

  const closeToneModal = () => {
    // Mark as postponed when user clicks "Fazer mais tarde"
    localStorage.setItem('tone_setup_postponed', 'true');
    console.log('⏰ Configuração de tom adiada');
    setShowToneModal(false);
  };

  const completeToneSetup = () => {
    localStorage.setItem('needs_tone_setup', 'false');
    localStorage.removeItem('tone_setup_postponed');
    console.log('✅ Configuração de tom completada');
    setShowToneModal(false);
  };

  return {
    showToneModal,
    checkToneSetupBeforeAction,
    closeToneModal,
    completeToneSetup
  };
};
