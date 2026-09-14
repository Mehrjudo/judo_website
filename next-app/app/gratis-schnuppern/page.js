import GratiSchnuppernClient from './GratiSchnuppernClient';
import { getJsonFromOneDrive } from '@/lib/graphClient';

export const metadata = {
  title: 'Gratis Schnuppern',
  description: 'Judo Anfängerkurse Herbst 2026 – gratis schnuppern ab 28. September 2026. Online Anmeldung für Kinder, Jugend und Erwachsene.',
};

export default async function GratiSchnuppernPage() {
  const data = await getJsonFromOneDrive('gratis-schnuppern.json', { subtitle: '', courses: [], infoCards: [] });
  return <GratiSchnuppernClient initialData={data} />;
}
