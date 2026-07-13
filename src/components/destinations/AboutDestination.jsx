import DestinationShell, { Reveal } from './DestinationShell.jsx';
import { User, Target, GraduationCap, MapPin, CircleCheck } from '../icons/Icons.jsx';

const STATS = [
    { icon: User, label: 'Designation', value: 'Aspiring Software Engineer' },
    { icon: Target, label: 'Focus', value: 'AI, ML & Intelligent Agents' },
    { icon: GraduationCap, label: 'Education', value: 'University of Auckland' },
    { icon: MapPin, label: 'Based In', value: 'Auckland, New Zealand' },
    { icon: CircleCheck, label: 'Status', value: 'Open to Internships & Grad Roles' },
];

const TAGS = ['AI Agents', 'Machine Learning', 'Full-Stack Dev', 'Creative Web'];

const AboutDestination = ({ open, onClose }) => (
    <DestinationShell
        open={open}
        onClose={onClose}
        className="dest-about"
        id="about"
        index="01"
        eyebrow="Identity Core"
        title="About Me"
    >
        <div className="about-grid">
            <Reveal className="about-id">
                <div className="about-orb" aria-hidden="true" />
                <p className="about-name">Desmond Li</p>
                <p className="about-role">Computer Science Graduate</p>
            </Reveal>

            <div className="about-body">
                <Reveal>
                    <p className="about-bio">
                        Postgraduate Computer Science student at the University of Auckland —
                        BSc complete, PGDipSci underway. Through university projects I&apos;ve
                        worked across the whole stack: backend services and APIs, mobile apps,
                        and database-driven systems, picking up new languages and tools as
                        each project needs them. I&apos;m especially drawn to AI and machine
                        learning — I build intelligent agents in my spare time, and I want to
                        go deep on how they reason, use tools, and stay reliable.
                    </p>
                </Reveal>

                <Reveal>
                    <ul className="about-stats">
                        {STATS.map((stat) => {
                            const StatIcon = stat.icon;
                            return (
                                <li key={stat.label}>
                                    <span className="about-stat-label">
                                        <StatIcon className="about-stat-icon" />
                                        {stat.label}
                                    </span>
                                    <span className="about-stat-value">{stat.value}</span>
                                </li>
                            );
                        })}
                    </ul>
                </Reveal>

                <Reveal className="about-tags">
                    {TAGS.map((tag, i) => (
                        <span key={i} className="about-tag">{tag}</span>
                    ))}
                </Reveal>
            </div>
        </div>
    </DestinationShell>
);

export default AboutDestination;
