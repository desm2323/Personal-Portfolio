import { Mail, Linkedin, Github, FileText } from './icons/Icons.jsx';
import { asset } from '../asset.js';

/* Static fallback for browsers/devices without WebGL — the journey can't
   render, so serve the essentials: who, what, and how to get in touch. */
const FallbackHero = () => (
    <main className="fallback-stage">
        <div className="fallback-card">
            <span className="dest-index">SYSTEM CHART UNAVAILABLE — TEXT TRANSMISSION</span>
            <h1 className="fallback-name">Desmond Li</h1>
            <p className="fallback-role">Computer Science Graduate · University of Auckland</p>
            <p className="fallback-copy">
                This portfolio is normally a scroll-driven journey through a 3D solar
                system, but your browser doesn&apos;t support WebGL — so here&apos;s the
                short version. I&apos;m an Auckland-based CS graduate (BSc complete,
                PGDipSci underway) seeking software engineering internships and graduate
                roles. I&apos;ve built across the stack — backend services, mobile apps,
                and database-driven systems — and I&apos;m especially drawn to AI and
                intelligent agents.
            </p>
            <div className="dest-actions">
                <a className="dest-btn dest-btn--solid" href="mailto:lidesmond2323@gmail.com">
                    <Mail />
                    Email me
                </a>
                <a className="dest-btn dest-btn--ghost" href={asset('Desmond_Li_CV.pdf')} download>
                    <FileText />
                    Download CV
                </a>
                <a
                    className="dest-btn dest-btn--ghost"
                    href="https://github.com/desm2323"
                    target="_blank"
                    rel="noreferrer"
                >
                    <Github />
                    GitHub
                </a>
                <a
                    className="dest-btn dest-btn--ghost"
                    href="https://www.linkedin.com/in/desmond-li-aa1935321/"
                    target="_blank"
                    rel="noreferrer"
                >
                    <Linkedin />
                    LinkedIn
                </a>
            </div>
        </div>
    </main>
);

export default FallbackHero;
