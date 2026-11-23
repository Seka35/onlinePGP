const DICEWARE_WORDS = [
    "acid","acorn","acre","acts","afar","affix","aged","agent","agile","aging","agony","ahead","aide","aids","aim","ajar",
    "alarm","album","alert","alike","alive","alley","allot","allow","alloy","aloft","alone","aloof","aloud","alpha","also","alter",
    "amber","amend","amino","ample","amuse","angel","anger","angle","angry","ankle","annex","anvil","apart","apex","apple","apply",
    "apron","aptly","arbor","arena","argue","arise","armed","armor","army","aroma","array","arrow","arson","artsy","ashes","aside",
    "asked","asset","atlas","atom","attic","audio","audit","auger","aunt","aura","auto","avail","avert","avoid","await","awake",
    "award","aware","awash","awful","awoke","axis","bacon","badge","badly","bagel","baggy","baker","balmy","banjo","barge","baron",
    "basic","basil","basin","basis","batch","baton","bayou","beach","beads","beady","beard","beast","beech","beefy","began","begin",
    "being","belch","belly","below","bench","berry","berth","bevel","bicep","biker","binge","bingo","biome","birch","birth","bison",
    "blade","blame","bland","blank","blast","blaze","bleak","bleed","blend","bless","blimp","blind","blink","bliss","blitz","bloat",
    "block","bloke","blond","blood","bloom","blown","bluer","bluff","blunt","blurb","blurt","blush","board","boast","bobby","bogus",
    "boils","bolts","bonus","booby","books","boost","booth","boots","booze","borax","bored","borer","borne","bosom","bossy","botch",
    "bound","bowel","boxer","brace","braid","brain","brake","brand","brash","brass","brave","bravo","brawl","brawn","bread","break",
    "breed","briar","bribe","brick","bride","brief","brine","bring","brink","brisk","broad","broil","broke","brood","brook","broom",
    "broth","brown","brunt","brush","brute","buddy","budge","buggy","bugle","build","built","bulge","bulky","bully","bunch","bunny",
    "burly","burnt","burst","bused","bushy","butch","buyer","bylaw","cabin","cable","cacao","cache","cacti","caddy","cadet","cagey",
    "cairn","camel","cameo","canal","candy","canny","canoe","canon","caper","carat","cargo","carol","carry","carve","caste","catch",
    "cater","catty","caulk","cause","cavil","cease","cedar","cello","chafe","chaff","chain","chair","chalk","champ","chant","chaos",
    "chard","charm","chart","chase","chasm","cheap","cheat","check","cheek","cheer","chess","chest","chick","chide","chief","child",
    "chili","chill","chime","china","chirp","chock","choir","choke","chord","chore","chose","chuck","chump","chunk","churn","chute",
    "cider","cigar","cinch","circa","civic","civil","clack","claim","clamp","clang","clank","clash","clasp","class","clean","clear",
    "cleat","cleft","clerk","click","cliff","climb","cling","clink","cloak","clock","clone","close","cloth","cloud","clout","clove",
    "clown","clubs","cluck","clued","clump","clung","coach","coast","cobra","cocoa","colon","color","comet","comfy","comic","comma",
    "conch","condo","conic","coral","corny","couch","cough","could","count","coupe","court","coven","cover","covet","cower","coyly",
    "crack","craft","cramp","crane","crank","crash","crass","crate","crave","crawl","craze","crazy","creak","cream","credo","creed",
    "creek","creep","creme","crepe","crept","cress","crest","crick","cried","crier","crime","crimp","crisp","croak","crock","crone",
    "crony","crook","cross","croup","crowd","crown","crude","cruel","crumb","crump","crush","crust","crypt","cubic","cumin","curio",
    "curly","curry","curse","curve","curvy","cutie","cyber","cycle","cynic","daddy","daily","dairy","daisy","dally","dance","dandy",
    "datum","daunt","dealt","death","debar","debit","debug","debut","decal","decay","decor","decoy","decry","defer","deign","deity",
    "delay","delta","delve","demon","demur","denim","dense","depot","depth","derby","deter","detox","deuce","devil","diary","dicey",
    "digit","dilly","dimly","diner","dingo","dingy","diode","dirge","dirty","disco","ditch","ditto","ditty","diver","dizzy","dodge",
    "dodgy","dogma","doing","dolly","donor","donut","dopey","doubt","dough","dowdy","dowel","downy","dowry","dozen","draft","drain",
    "drake","drama","drank","drape","drawl","drawn","dread","dream","dress","dried","drier","drift","drill","drink","drive","droit",
    "droll","drone","drool","droop","dross","drove","drown","druid","drunk","dryer","dryly","duchy","dully","dummy","dumpy","dunce",
    "dusky","dusty","dutch","duvet","dwarf","dwell","dwelt","dying","eager","eagle","early","earth","easel","eaten","eater","ebony",
    "eclat","edict","edify","eerie","egret","eight","eject","eking","elate","elbow","elder","elect","elegy","elfin","elide","elite"
];

function randInt(max) {
    const arr = new Uint32Array(1);
    const limit = Math.floor(0x100000000 / max) * max;
    let r;
    do {
        crypto.getRandomValues(arr);
        r = arr[0];
    } while (r >= limit);
    return r % max;
}

function generatePassword() {
    const len = parseInt(document.getElementById('pwLength').value, 10) || 20;
    const useUpper = document.getElementById('pwUpper').checked;
    const useLower = document.getElementById('pwLower').checked;
    const useDigits = document.getElementById('pwDigits').checked;
    const useSymbols = document.getElementById('pwSymbols').checked;
    const noAmbig = document.getElementById('pwNoAmbig').checked;
    const count = parseInt(document.getElementById('pwCount').value, 10) || 1;

    let charset = '';
    if (useUpper) charset += noAmbig ? 'ABCDEFGHJKLMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (useLower) charset += noAmbig ? 'abcdefghijkmnopqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz';
    if (useDigits) charset += noAmbig ? '23456789' : '0123456789';
    if (useSymbols) charset += '!@#$%^&*()-_=+[]{};:,.?';

    const status = document.getElementById('pwStatus');
    if (!charset) {
        status.className = 'tool-status error';
        status.textContent = 'Select at least one character type.';
        return;
    }
    status.className = 'tool-status';

    const results = [];
    for (let c = 0; c < count; c++) {
        let pw = '';
        for (let i = 0; i < len; i++) {
            pw += charset[randInt(charset.length)];
        }
        results.push(pw);
    }
    document.getElementById('pwOutput').value = results.join('\n');

    const entropy = Math.round(len * Math.log2(charset.length));
    updateEntropy(entropy);
}

function generatePassphrase() {
    const wordsCount = parseInt(document.getElementById('ppWords').value, 10) || 6;
    const sep = document.getElementById('ppSep').value;
    const cap = document.getElementById('ppCap').checked;
    const count = parseInt(document.getElementById('pwCount').value, 10) || 1;

    const results = [];
    for (let c = 0; c < count; c++) {
        const chosen = [];
        for (let i = 0; i < wordsCount; i++) {
            let w = DICEWARE_WORDS[randInt(DICEWARE_WORDS.length)];
            if (cap) w = w.charAt(0).toUpperCase() + w.slice(1);
            chosen.push(w);
        }
        results.push(chosen.join(sep));
    }
    document.getElementById('pwOutput').value = results.join('\n');

    const entropy = Math.round(wordsCount * Math.log2(DICEWARE_WORDS.length));
    updateEntropy(entropy);
}

function updateEntropy(bits) {
    const el = document.getElementById('pwEntropy');
    let label = 'Weak';
    let color = '#f87171';
    if (bits >= 80) { label = 'Very Strong'; color = '#34d399'; }
    else if (bits >= 60) { label = 'Strong'; color = '#10b981'; }
    else if (bits >= 40) { label = 'Moderate'; color = '#fbbf24'; }
    el.innerHTML = `Estimated entropy: <strong>${bits} bits</strong> (<span style="color:${color}">${label}</span>)`;
}
