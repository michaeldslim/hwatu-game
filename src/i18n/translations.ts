import type { AppLanguage } from '../types/game';

export type TranslationKey =
  | 'home.title'
  | 'home.subtitle'
  | 'home.play'
  | 'home.howToPlay'
  | 'home.settings'
  | 'home.career'
  | 'setup.gameMode'
  | 'setup.aiDifficulty'
  | 'setup.comingSoon'
  | 'settings.title'
  | 'settings.language'
  | 'settings.feedback'
  | 'settings.sound'
  | 'settings.soundDesc'
  | 'settings.soundVolume'
  | 'settings.haptics'
  | 'settings.hapticsDesc'
  | 'settings.gameSpeed'
  | 'settings.gameplay'
  | 'settings.hints'
  | 'settings.hintsDesc'
  | 'settings.credit'
  | 'game.leave'
  | 'game.yourTurn'
  | 'game.aiTurn'
  | 'game.goStop'
  | 'game.calledGo'
  | 'game.loadingResults'
  | 'game.dealer'
  | 'game.points'
  | 'game.handCount'
  | 'game.table'
  | 'game.cardCount'
  | 'game.chooseTable'
  | 'game.chooseFlipMatch'
  | 'game.stack'
  | 'game.deck'
  | 'game.flipped'
  | 'game.target'
  | 'game.yourHand'
  | 'game.collected'
  | 'game.yourCollected'
  | 'game.yaku.godori'
  | 'game.yaku.hongdan'
  | 'game.yaku.cheongdan'
  | 'game.yaku.chodan'
  | 'game.specialMoves'
  | 'rules.title'
  | 'rules.back'
  | 'rules.deck.title'
  | 'rules.deck.body'
  | 'rules.setup.title'
  | 'rules.setup.body'
  | 'rules.turn.title'
  | 'rules.turn.body'
  | 'rules.scoring.title'
  | 'rules.scoring.body'
  | 'rules.goStop.title'
  | 'rules.goStop.body'
  | 'rules.special.title'
  | 'rules.special.body'
  | 'rules.september.title'
  | 'rules.september.body'
  | 'rules.career.title'
  | 'rules.career.body'
  | 'common.back'
  | 'common.home'
  | 'common.player'
  | 'result.headline.win'
  | 'result.headline.lose'
  | 'result.headline.draw'
  | 'result.headline.nagari'
  | 'result.headline.autoWinHuman'
  | 'result.headline.autoWinAi'
  | 'result.goCount'
  | 'result.nagariHint'
  | 'result.settlement'
  | 'result.netChips'
  | 'result.pays'
  | 'result.paysLine'
  | 'result.goBak'
  | 'result.piBak'
  | 'result.gwangBak'
  | 'result.scoreBreakdown'
  | 'result.collectedCounts'
  | 'result.scorePoints'
  | 'result.godoriSuffix'
  | 'result.hongdanSuffix'
  | 'result.cheongdanSuffix'
  | 'result.chodanSuffix'
  | 'result.bonusPiLine'
  | 'result.bonusPiSuffix'
  | 'result.collected'
  | 'result.playAgain'
  | 'career.rank.intern'
  | 'career.rank.staff'
  | 'career.rank.assistant'
  | 'career.rank.manager'
  | 'career.rank.deputy'
  | 'career.rank.director'
  | 'career.rank.executive'
  | 'career.rank.ceo'
  | 'career.promoted.title'
  | 'career.promoted.subtitle'
  | 'career.ceoReached.title'
  | 'career.ceoReached.subtitle'
  | 'career.progress'
  | 'career.progressNext'
  | 'career.lossKeepsProgress'
  | 'career.noProgressDifficulty'
  | 'career.nagariNoChange'
  | 'career.homeBadge'
  | 'career.maxRank'
  | 'career.modeLabel'
  | 'career.modeDesc'
  | 'career.rulesSnippet'
  | 'career.rulesLink'
  | 'career.screen.title'
  | 'career.screen.currentRank'
  | 'career.screen.highestRank'
  | 'career.screen.ladderTitle'
  | 'career.screen.disabledTitle'
  | 'career.screen.disabledBody'
  | 'career.screen.enableInSettings'
  | 'career.screen.viewRules'
  | 'career.ladder.achieved'
  | 'career.ladder.current'
  | 'career.ladder.locked'
  | 'career.ladder.startingRank'
  | 'career.ladder.requirement'
  | 'career.ladder.requirementDifficulty'
  | 'career.ladder.progressToNext'
  | 'career.difficultySuggest.body'
  | 'career.difficultySuggest.action'
  | 'settings.career'
  | 'settings.avatars'
  | 'settings.playerAvatar'
  | 'settings.playerAvatarDesc'
  | 'settings.aiAvatar'
  | 'settings.aiAvatarDesc';

type TranslationParams = Record<string, string | number>;

const en: Record<TranslationKey, string> = {
  'home.title': 'Hwatu',
  'home.subtitle': '화투',
  'home.play': 'Play',
  'home.howToPlay': 'How to Play',
  'home.settings': '설정 / Settings',
  'home.career': 'Career Progress',
  'setup.gameMode': 'Game Mode',
  'setup.aiDifficulty': 'AI Difficulty',
  'setup.comingSoon': 'Coming soon',
  'settings.title': 'Settings',
  'settings.language': 'Language',
  'settings.feedback': 'Feedback',
  'settings.sound': 'Sound Effects',
  'settings.soundDesc': 'Card flip, match, Go/Stop',
  'settings.soundVolume': 'Volume',
  'settings.haptics': 'Haptics',
  'settings.hapticsDesc': 'Vibration on match and Go',
  'settings.gameSpeed': 'Game Speed',
  'settings.gameplay': 'Gameplay',
  'settings.hints': 'Turn Hints',
  'settings.hintsDesc': 'Highlight the best card to play on your turn',
  'settings.credit': 'Card art: Wikimedia Commons (CC BY-SA 4.0)',
  'game.leave': '← Leave',
  'game.yourTurn': 'Your turn',
  'game.aiTurn': 'AI turn…',
  'game.goStop': 'Go / Stop',
  'game.calledGo': '{name} called Go ({count} Go)',
  'game.loadingResults': 'Loading results…',
  'game.dealer': 'Dealer',
  'game.points': '{score} pts',
  'game.handCount': '{count} in hand',
  'game.table': 'Table',
  'game.cardCount': '{count} cards',
  'game.chooseTable': 'Tap a matching table card',
  'game.chooseFlipMatch': 'Tap a table card to match the flipped card',
  'game.stack': 'Stack {count}',
  'game.deck': 'Deck {count}',
  'game.flipped': 'Flipped',
  'game.target': 'Target {score} · {mode}',
  'game.yourHand': 'Your Hand',
  'game.collected': 'Collected',
  'game.yourCollected': 'Your collected',
  'game.yaku.godori': 'Godori!',
  'game.yaku.hongdan': 'Hongdan!',
  'game.yaku.cheongdan': 'Cheongdan!',
  'game.yaku.chodan': 'Chodan!',
  'game.specialMoves': 'Special',
  'rules.title': 'How to Play',
  'rules.back': '← Back',
  'rules.deck.title': 'The Deck',
  'rules.deck.body':
    'Hwatu has 48 cards — 4 per month. Match by month (same flower). Types: Bright (광), Animal (열끗), Ribbon (띠), Junk (피). 25 pi total including 3 쌍피 (double junk).',
  'rules.setup.title': 'Setup',
  'rules.setup.body':
    'Go-Stop (3P): 7 cards each, 6 on table, stop at 3 points. Matgo (2P): 10 cards each, 8 on table, stop at 7 points.',
  'rules.turn.title': 'Your Turn',
  'rules.turn.body':
    'Play one hand card, flip the top deck card, then collect matches by month. If 3 same-month cards stack (뻑), they cannot be taken until a fourth match.',
  'rules.scoring.title': 'Scoring',
  'rules.scoring.body':
    '3 광 = 3 (비광 with rain = 2) · 4 광 = 4 · 5 광 = 15 · Godori (Feb+Apr+Aug) = 5 · 5+ 열끗/띠 = 1+ · 7+ 열끗 = 2× final · 10+ 피 = 1+ · 쌍피 = 2 pi each',
  'rules.goStop.title': 'Go / Stop',
  'rules.goStop.body':
    'At target score: Stop to win, or Go for bonus (+1 at 1고/2고, then ×2 at 3고+). Risk 고박 if an opponent wins first. 나가리 = void hand, next hand pays double.',
  'rules.special.title': 'Special Moves',
  'rules.special.body':
    '쪽 · 따닥 · 싹쓸이 · 뻑 — take 1 피 from each opponent. 흔들기 · 폭탄 — declare with 3 of a month; 2× score if you win.',
  'rules.september.title': 'September Cup',
  'rules.september.body':
    'The 9월 국화잔 can be scored as either 열끗 (animal) or 쌍피 (double junk, +2 pi). Choose when you collect it.',
  'rules.career.title': 'Career Mode (Promotion)',
  'rules.career.body':
    'Turn on Career mode in Settings to climb from Intern to CEO. Each rank needs match wins vs AI (any mode: Matgo, Go-Stop, Hwatu Simple).\n\n' +
    '· Intern → Staff: 3 wins\n' +
    '· Staff → Assistant Manager: 5 wins\n' +
    '· Assistant Manager → Manager: 7 wins\n' +
    '· Manager → Deputy Director: 10 wins\n' +
    '· Deputy Director → Director: 5 wins at Intermediate+ AI\n' +
    '· Director → Executive VP: 7 wins at Advanced+ AI\n' +
    '· Executive VP → CEO: 5 wins at Expert AI\n\n' +
    'Losses do not reset your win count or lower your rank. Only one promotion per match win — no skipping ranks. Wins reset to 0 after each promotion. Nagari does not change progress. Turn off Career mode in Settings to play without tracking.',
  'common.back': '← Back',
  'common.home': '← Home',
  'common.player': 'Player',
  'result.headline.win': 'Congratulations!',
  'result.headline.lose': 'You lose',
  'result.headline.draw': 'Draw',
  'result.headline.nagari': 'Nagari',
  'result.headline.autoWinHuman': 'Four of a month — you win!',
  'result.headline.autoWinAi': 'AI wins — four of a month',
  'result.goCount': '{count} Go',
  'result.nagariHint': 'Next hand pays {multiplier}×',
  'result.settlement': 'Settlement',
  'result.netChips': 'Net gain',
  'result.pays': 'pays',
  'result.paysLine': '{name}: {amount} pts',
  'result.goBak': ' · Go bak',
  'result.piBak': ' · Pi bak',
  'result.gwangBak': ' · Gwang bak',
  'result.scoreBreakdown': 'Score breakdown',
  'result.collectedCounts':
    'Collected: {bright} bright · {animal} animals · {ribbon} ribbons · {pi} pi',
  'result.scorePoints':
    'Points: bright {bright} · animals {animal} · ribbons {ribbon} · junk {junk}{extras}',
  'result.godoriSuffix': ' · godori {count}',
  'result.hongdanSuffix': ' · hongdan {count}',
  'result.cheongdanSuffix': ' · cheongdan {count}',
  'result.chodanSuffix': ' · chodan {count}',
  'result.bonusPiLine': 'Bonus pi from special moves: {count}',
  'result.bonusPiSuffix': ' · bonus pi {count}',
  'result.collected': 'Collected',
  'result.playAgain': 'Play Again',
  'career.rank.intern': 'Intern',
  'career.rank.staff': 'Staff',
  'career.rank.assistant': 'Assistant Manager',
  'career.rank.manager': 'Manager',
  'career.rank.deputy': 'Deputy Director',
  'career.rank.director': 'Director',
  'career.rank.executive': 'Executive VP',
  'career.rank.ceo': 'CEO',
  'career.promoted.title': 'Promoted!',
  'career.promoted.subtitle': 'You are now {rank}',
  'career.ceoReached.title': 'Congratulations!',
  'career.ceoReached.subtitle': 'You are the CEO',
  'career.progress': '{rank} · {current}/{required} wins',
  'career.progressNext': 'Next: {nextRank} ({required} wins)',
  'career.lossKeepsProgress': '{rank} · {current}/{required} wins — still on track',
  'career.noProgressDifficulty': 'No promotion credit — need {minDifficulty}+',
  'career.nagariNoChange': 'Nagari — progress unchanged',
  'career.homeBadge': '{rank} · {current}/{required}',
  'career.maxRank': '{rank} · top rank',
  'career.modeLabel': 'Career mode',
  'career.modeDesc': 'Climb the ranks by winning matches',
  'career.rulesSnippet':
    'Intern→Staff 3 wins · Staff→Assistant 5 · Assistant→Manager 7 · Manager→Deputy 10 · Deputy+ needs higher AI difficulty. Losses do not reset progress.',
  'career.rulesLink': 'View promotion rules',
  'career.screen.title': 'Career',
  'career.screen.currentRank': 'Current rank',
  'career.screen.highestRank': 'Highest achieved',
  'career.screen.ladderTitle': 'Rank ladder',
  'career.screen.disabledTitle': 'Career mode is off',
  'career.screen.disabledBody': 'Turn on Career mode in Settings to track your rank and promotion progress.',
  'career.screen.enableInSettings': 'Open Settings',
  'career.screen.viewRules': 'Promotion rules',
  'career.ladder.achieved': 'Achieved',
  'career.ladder.current': 'Current',
  'career.ladder.locked': 'Locked',
  'career.ladder.startingRank': 'Starting rank',
  'career.ladder.requirement': '{wins} wins to reach',
  'career.ladder.requirementDifficulty': '{wins} wins at {difficulty}+ to reach',
  'career.ladder.progressToNext': '{current}/{required} wins → {nextRank}',
  'career.difficultySuggest.body':
    'From {rank} onward, promotion wins only count at {difficulty}+ AI. Your default is lower — bump it to keep progressing.',
  'career.difficultySuggest.action': 'Set default to {difficulty}',
  'settings.career': 'Career',
  'settings.avatars': 'Avatars',
  'settings.playerAvatar': 'Your Avatar',
  'settings.playerAvatarDesc': 'Shown on the home screen, career, and during play',
  'settings.aiAvatar': 'AI Avatar',
  'settings.aiAvatarDesc': 'Opponent face in game and results (2nd AI differs in 3-player)',
};

const ko: Record<TranslationKey, string> = {
  'home.title': 'Hwatu',
  'home.subtitle': '화투',
  'home.play': '플레이',
  'home.howToPlay': '게임 방법',
  'home.settings': '설정 / Settings',
  'home.career': '승진 현황',
  'setup.gameMode': '게임 모드',
  'setup.aiDifficulty': 'AI 난이도',
  'setup.comingSoon': '준비 중',
  'settings.title': '설정',
  'settings.language': '언어',
  'settings.feedback': '피드백',
  'settings.sound': '효과음',
  'settings.soundDesc': '카드 뒤집기, 매칭, 고/스톱',
  'settings.soundVolume': '볼륨',
  'settings.haptics': '햅틱',
  'settings.hapticsDesc': '매칭 및 고 선언 시 진동',
  'settings.gameSpeed': '게임 속도',
  'settings.gameplay': '게임플레이',
  'settings.hints': '턴 힌트',
  'settings.hintsDesc': '플레이어 차례에 추천 패를 표시합니다',
  'settings.credit': '카드 아트: Wikimedia Commons (CC BY-SA 4.0)',
  'game.leave': '← 나가기',
  'game.yourTurn': '플레이어 차례',
  'game.aiTurn': 'AI 차례…',
  'game.goStop': '고 / 스톱',
  'game.calledGo': '{name} 고! ({count}고)',
  'game.loadingResults': '결과로 이동 중…',
  'game.dealer': '선',
  'game.points': '{score}점',
  'game.handCount': '손패 {count}',
  'game.table': '바닥',
  'game.cardCount': '{count}장',
  'game.chooseTable': '가져갈 바닥 패를 선택하세요',
  'game.chooseFlipMatch': '뒤집은 패와 맞출 바닥 패를 선택하세요',
  'game.stack': '스택 {count}',
  'game.deck': '덱 {count}',
  'game.flipped': '방금 뒤집음',
  'game.target': '목표 {score}점 · {mode}',
  'game.yourHand': '내 손패',
  'game.collected': '따낸 패',
  'game.yourCollected': '내가 딴 패',
  'game.yaku.godori': '고도리!',
  'game.yaku.hongdan': '홍단!',
  'game.yaku.cheongdan': '청단!',
  'game.yaku.chodan': '초단!',
  'game.specialMoves': '특수',
  'rules.title': '게임 방법',
  'rules.back': '← 뒤로',
  'rules.deck.title': '화투 덱',
  'rules.deck.body':
    '화투는 48장 — 월별 4장. 같은 꽃(월)로 매칭합니다. 종류: 광, 열끗, 띠, 피. 쌍피 3장 포함 총 25피.',
  'rules.setup.title': '셋업',
  'rules.setup.body':
    '고스톱(3인): 손패 7장, 바닥 6장, 3점에서 스톱. 맞고(2인): 손패 10장, 바닥 8장, 7점에서 스톱.',
  'rules.turn.title': '턴 진행',
  'rules.turn.body':
    '손패 1장 내기 → 덱에서 1장 뒤집기 → 같은 월 매칭하여 가져가기. 뻑(3장 스택)은 네 번째가 나올 때까지 가져갈 수 없습니다.',
  'rules.scoring.title': '점수',
  'rules.scoring.body':
    '3광=3(비광=2) · 4광=4 · 5광=15 · 고도리(2·4·8월)=5 · 열끗/띠 5장 이상=1+ · 열끗 7장 이상=2배 · 피 10장 이상=1+ · 쌍피=2피',
  'rules.goStop.title': '고 / 스톱',
  'rules.goStop.body':
    '목표 점수 도달 시: 스톱으로 승리, 또는 고로 보너스(1·2고 +1점, 3고 이상 2배). 상대가 먼저 이기면 고박. 나가리는 무효 판, 다음 판 2배.',
  'rules.special.title': '특수 기술',
  'rules.special.body':
    '쪽·따닥·싹쓸이·뻑 — 상대마다 1피. 흔들기·폭탄 — 같은 월 3장 선언, 승리 시 2배.',
  'rules.september.title': '9월 국화잔',
  'rules.september.body':
    '9월 국화잔은 열끗 또는 쌍피(+2피)로 채점할 수 있습니다. 가져갈 때 선택하세요.',
  'rules.career.title': '승진제 (Career Mode)',
  'rules.career.body':
    '설정에서 승진 모드를 켜면 인턴에서 사장까지 직급을 올릴 수 있습니다. 맞고·고스톱·화투 심플 등 AI 대전 승리가 승진에 반영됩니다.\n\n' +
    '· 인턴 → 사원: 3승\n' +
    '· 사원 → 대리: 5승\n' +
    '· 대리 → 과장: 7승\n' +
    '· 과장 → 차장: 10승\n' +
    '· 차장 → 부장: 중급 이상 AI로 5승\n' +
    '· 부장 → 전무: 고급 이상 AI로 7승\n' +
    '· 전무 → 사장: 전문가 AI로 5승\n\n' +
    '패배해도 승진 카운트와 직급은 유지됩니다. 한 판에 한 단계만 승진하며 직급을 건너뛰지 않습니다. 승진 후 카운트는 0부터 다시 시작합니다. 나가리는 진행에 영향 없습니다. 승진 모드를 끄면 기록 없이 자유 플레이합니다.',
  'common.back': '← 뒤로',
  'common.home': '← 홈',
  'common.player': '플레이어',
  'result.headline.win': '축하합니다!',
  'result.headline.lose': '패배',
  'result.headline.draw': '무승부',
  'result.headline.nagari': '나가리',
  'result.headline.autoWinHuman': '4월 승 — 자동 승리!',
  'result.headline.autoWinAi': 'AI 4월 승',
  'result.goCount': '{count}고',
  'result.nagariHint': '다음 판 {multiplier}배 정산',
  'result.settlement': '정산',
  'result.netChips': '총 획득 점수',
  'result.pays': '정산',
  'result.paysLine': '{name}: {amount}점',
  'result.goBak': ' · 고박',
  'result.piBak': ' · 피박',
  'result.gwangBak': ' · 광박',
  'result.scoreBreakdown': '점수 내역',
  'result.collectedCounts':
    '따낸 패: 광 {bright} · 열끗 {animal} · 띠 {ribbon} · 피 {pi}',
  'result.scorePoints':
    '점수: 광 {bright} · 열끗 {animal} · 띠 {ribbon} · 피 {junk}{extras}',
  'result.godoriSuffix': ' · 고도리 {count}',
  'result.hongdanSuffix': ' · 홍단 {count}',
  'result.cheongdanSuffix': ' · 청단 {count}',
  'result.chodanSuffix': ' · 초단 {count}',
  'result.bonusPiLine': '특수 패 보너스 피: {count}',
  'result.bonusPiSuffix': ' · 보너스피 {count}',
  'result.collected': '따낸 패',
  'result.playAgain': '다시 하기',
  'career.rank.intern': '인턴',
  'career.rank.staff': '사원',
  'career.rank.assistant': '대리',
  'career.rank.manager': '과장',
  'career.rank.deputy': '차장',
  'career.rank.director': '부장',
  'career.rank.executive': '전무',
  'career.rank.ceo': '사장',
  'career.promoted.title': '승진합니다!',
  'career.promoted.subtitle': '{rank}으로 승진했습니다',
  'career.ceoReached.title': '축하합니다!',
  'career.ceoReached.subtitle': '사장이 되었습니다',
  'career.progress': '{rank} · {current}/{required}승',
  'career.progressNext': '다음: {nextRank} ({required}승)',
  'career.lossKeepsProgress': '{rank} · {current}/{required}승 — 진행 유지',
  'career.noProgressDifficulty': '승진 카운트 없음 — {minDifficulty} 이상 필요',
  'career.nagariNoChange': '나가리 — 진행 변동 없음',
  'career.homeBadge': '{rank} · {current}/{required}',
  'career.maxRank': '{rank} · 최고 직급',
  'career.modeLabel': '승진 모드',
  'career.modeDesc': '승리 횟수로 직급을 올립니다',
  'career.rulesSnippet':
    '인턴→사원 3승 · 사원→대리 5 · 대리→과장 7 · 과장→차장 10 · 차장+는 더 높은 AI 난이도 필요. 패배해도 진행은 유지됩니다.',
  'career.rulesLink': '승진 규칙 보기',
  'career.screen.title': '승진 현황',
  'career.screen.currentRank': '현재 직급',
  'career.screen.highestRank': '최고 직급',
  'career.screen.ladderTitle': '직급 사다리',
  'career.screen.disabledTitle': '승진 모드가 꺼져 있습니다',
  'career.screen.disabledBody': '설정에서 승진 모드를 켜면 직급과 승진 진행을 기록합니다.',
  'career.screen.enableInSettings': '설정 열기',
  'career.screen.viewRules': '승진 규칙',
  'career.ladder.achieved': '달성',
  'career.ladder.current': '현재',
  'career.ladder.locked': '미달성',
  'career.ladder.startingRank': '시작 직급',
  'career.ladder.requirement': '승진 조건: {wins}승',
  'career.ladder.requirementDifficulty': '승진 조건: {difficulty} 이상 {wins}승',
  'career.ladder.progressToNext': '{current}/{required}승 → {nextRank}',
  'career.difficultySuggest.body':
    '{rank}부터 승진 카운트는 {difficulty} 이상 AI 승리만 인정됩니다. 기본 난이도가 낮아요 — 올리면 승진이 쌓입니다.',
  'career.difficultySuggest.action': '기본 난이도 {difficulty}으로 변경',
  'settings.career': '승진제',
  'settings.avatars': '아바타',
  'settings.playerAvatar': '내 아바타',
  'settings.playerAvatarDesc': '메인, 승진 현황, 게임 중에 표시됩니다',
  'settings.aiAvatar': 'AI 아바타',
  'settings.aiAvatarDesc': '게임·결과 화면의 상대 얼굴 (3인 고스톱은 2번째 AI는 다른 얼굴)',
};

const catalogs: Record<AppLanguage, Record<TranslationKey, string>> = { en, ko };

export function translate(
  language: AppLanguage,
  key: TranslationKey,
  params?: TranslationParams,
): string {
  let text = catalogs[language][key] ?? catalogs.en[key] ?? key;

  if (params) {
    for (const [paramKey, value] of Object.entries(params)) {
      text = text.replace(`{${paramKey}}`, String(value));
    }
  }

  return text;
}

export const RULE_SECTION_KEYS: RuleSection[] = [
  { title: 'rules.deck.title', body: 'rules.deck.body' },
  { title: 'rules.setup.title', body: 'rules.setup.body' },
  { title: 'rules.turn.title', body: 'rules.turn.body' },
  { title: 'rules.scoring.title', body: 'rules.scoring.body' },
  { title: 'rules.goStop.title', body: 'rules.goStop.body' },
  { title: 'rules.special.title', body: 'rules.special.body' },
  { title: 'rules.september.title', body: 'rules.september.body' },
  { title: 'rules.career.title', body: 'rules.career.body', id: 'career' },
];

export interface RuleSection {
  title: TranslationKey;
  body: TranslationKey;
  id?: string;
}
