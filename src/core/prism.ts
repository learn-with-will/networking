// Prism core + the languages the Networking lessons use. `bash` is the only
// highlighted language — the course teaches through command-line tool sessions
// (ping, dig, curl, traceroute, ss, tcpdump, ip). Plain `text` fences
// (packet/header layouts, ASCII topology diagrams, console output) are left
// unhighlighted on purpose, so no grammar is imported for them.
import Prism from 'prismjs';
import 'prismjs/components/prism-bash';
import 'prismjs/themes/prism-tomorrow.css';

export default Prism;
