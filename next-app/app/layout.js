import './globals.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { Providers } from './providers';

export const metadata = {
  title: { default: 'PSV Salzburg – Judo | die JUDO Anlaufstelle in Salzburg', template: '%s | PSV Salzburg Judo' },
  description: 'PSV Salzburg – Judo: Judotraining für Kinder, Jugend und Erwachsene in Salzburg. Gratis Schnuppern ab 28. September 2026.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body>
        <Providers>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
