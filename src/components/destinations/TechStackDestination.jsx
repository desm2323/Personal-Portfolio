import DestinationShell, { Reveal } from './DestinationShell.jsx';
import { Code2, Layers, Database, Wrench, Sparkles } from '../icons/Icons.jsx';

const MODULES = [
    {
        name: 'Languages',
        icon: Code2,
        level: 90,
        items: ['Python', 'Java', 'JavaScript', 'C#', 'SQL', 'HTML', 'CSS'],
    },
    {
        name: 'Frameworks & Tech',
        icon: Layers,
        level: 85,
        items: ['Node.js', 'Express.js', 'Flask', 'React', 'Three.js', 'Flutter', 'Firebase', 'Prisma', 'JAX-RS', 'Jinja'],
    },
    {
        name: 'Databases',
        icon: Database,
        level: 78,
        items: ['PostgreSQL', 'MySQL', 'MongoDB', 'SQLite'],
    },
    {
        name: 'Tools & Practices',
        icon: Wrench,
        level: 80,
        items: ['Docker', 'Git', 'Jira', 'REST API Design', 'Unit Testing', 'Agile Teamwork'],
    },
    {
        name: 'Currently Exploring',
        icon: Sparkles,
        level: 60,
        wide: true,
        items: ['LLM Tool-Calling (ReAct)', 'Agent Design', 'Prompt Engineering', 'OpenAI API', 'Retrieval over Knowledge Bases'],
    },
];

const TechStackDestination = ({ open, onClose }) => (
    <DestinationShell
        open={open}
        onClose={onClose}
        className="dest-tech"
        id="tech"
        index="02"
        eyebrow="Systems Online"
        title="Tech Stack"
    >
        <div className="tech-grid">
            {MODULES.map((mod) => {
                const ModuleIcon = mod.icon;
                return (
                    <Reveal
                        className={`tech-module${mod.wide ? ' tech-module--wide' : ''}`}
                        key={mod.name}
                    >
                        <div className="tech-module-head">
                            <span className="tech-module-icon" aria-hidden="true">
                                <ModuleIcon />
                            </span>
                            <span className="tech-module-name">{mod.name}</span>
                            <span
                                className="tech-module-bar"
                                role="meter"
                                aria-label={`${mod.name} proficiency`}
                                aria-valuenow={mod.level}
                                aria-valuemin={0}
                                aria-valuemax={100}
                            >
                                <i style={{ '--level': `${mod.level}%` }} />
                            </span>
                        </div>
                        <div className="tech-chips">
                            {mod.items.map((item, j) => (
                                <span className="tech-chip" key={j}>
                                    <span className="tech-chip-dot" aria-hidden="true" />
                                    {item}
                                </span>
                            ))}
                        </div>
                    </Reveal>
                );
            })}
        </div>
    </DestinationShell>
);

export default TechStackDestination;
