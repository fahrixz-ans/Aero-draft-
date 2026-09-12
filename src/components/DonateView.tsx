import React from 'react';
import DonateViewMain from './views/DonateView';

interface DonateViewProps {
  onNavigate?: (view: string) => void;
  onBack?: () => void;
  onBackHome?: () => void;
  user?: any;
  onSignIn?: () => void | Promise<void>;
}

export default function DonateView(props: DonateViewProps) {
  return <DonateViewMain {...props} />;
}
