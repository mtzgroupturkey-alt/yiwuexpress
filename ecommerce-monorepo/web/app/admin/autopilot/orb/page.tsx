import { Metadata } from 'next';
import { NeuralCockpit } from '@/lib/autopilot/ui/neural/NeuralCockpit';

export const metadata: Metadata = {
  title: 'Neural Cockpit (The Brain) | Auto-Pilot',
  description: 'Synaptic neural network control center for autonomous business intelligence',
};

export default function NeuralOrbPage() {
  return <NeuralCockpit />;
}
