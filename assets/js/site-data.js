(function () {
  const games = [
    {
      slug: 'galactic-runner',
      title: 'Galactic Runner',
      shortDescription: 'Dodge plasma barriers and chase neon records in this synthwave spaceway sprint.',
      description:
        'Galactic Runner is a high-velocity browser racer that drops you into procedurally generated hyperspace lanes. Lean on drift boosts, chain dash pads and react to remixing synth tracks while you dodge plasma barriers.',
      categories: ['Racing', 'Arcade'],
      tags: ['endless runner', 'synthwave', 'speed'],
      releaseDate: '2024-01-12',
      rating: 4.7,
      playTime: '3-5 min per run',
      cover: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
      hero: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80',
      screenshots: [
        'https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1526401485004-46910ecc8e51?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1472457897821-70d3819a0e24?auto=format&fit=crop&w=1200&q=80'
      ],
      embedUrl: '/assets/playables/runner.html?label=Galactic%20Runner&palette=neon&speed=1.12',
      playUrl: '/assets/playables/runner.html?label=Galactic%20Runner&palette=neon&speed=1.12',
      controls: ['← → to steer lanes', 'Space to dash through obstacles'],
      platforms: ['Web Browser', 'Mobile Friendly'],
      developer: 'Photon Forge Collective',
      languages: ['English'],
      features: ['Procedural lanes every run', 'Reactive synth soundtrack', 'Global ghost leaderboard'],
      recommended: ['neon-drift', 'synthwave-rider', 'shadow-arena']
    },
    {
      slug: 'neon-drift',
      title: 'Neon Drift',
      shortDescription: 'Time-attack racing through cyberpunk alleys with responsive swipe controls.',
      description:
        'Neon Drift condenses arcade drifting into 90-second runs. Charge nitro through perfect slides, weave between lightwalls and chase leaderboard ghosts as the skyline pulses with vaporwave hues.',
      categories: ['Racing', 'Time Attack'],
      tags: ['drifting', 'cyberpunk', 'leaderboards'],
      releaseDate: '2023-10-04',
      rating: 4.5,
      playTime: '90-second sprints',
      cover: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80',
      hero: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
      screenshots: [
        'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80'
      ],
      embedUrl: '/assets/playables/runner.html?label=Neon%20Drift&palette=violet&speed=1.25',
      playUrl: '/assets/playables/runner.html?label=Neon%20Drift&palette=violet&speed=1.25',
      controls: ['← → or A/D to drift', 'Hold Space for nitro'],
      platforms: ['Web Browser'],
      developer: 'CityGrid Labs',
      languages: ['English'],
      features: ['Dynamic drifting lanes', 'Ghost car chasing', 'Daily drift challenges'],
      recommended: ['galactic-runner', 'synthwave-rider']
    },
    {
      slug: 'pixel-racer',
      title: 'Pixel Racer',
      shortDescription: 'Thread through 16-bit traffic, chaining drift boosts and nitro bursts in a retro street sprint.',
      description:
        'Pixel Racer is a top-down retro racer tuned for lightning-fast laps. Weave through procedurally generated traffic, feather the brake to chain drifts, and trigger nitro bursts to chase pixel-perfect records.',
      categories: ['Racing', 'Arcade'],
      tags: ['retro', 'drift', 'top-down'],
      releaseDate: '2024-04-09',
      rating: 4.4,
      playTime: '2-4 min heats',
      cover: 'https://images.unsplash.com/photo-1526404428533-25d31580b5c3?auto=format&fit=crop&w=1200&q=80',
      hero: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1200&q=80',
      screenshots: [
        'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=1200&q=80'
      ],
      embedUrl: '/assets/playables/runner.html?label=Pixel%20Racer&palette=amber&speed=1.15&drift=1',
      playUrl: '/assets/playables/runner.html?label=Pixel%20Racer&palette=amber&speed=1.15&drift=1',
      controls: ['← → to weave through traffic', 'Space to trigger drift boost'],
      platforms: ['Web Browser', 'Mobile Friendly'],
      developer: 'Bitshift Garage',
      languages: ['English'],
      features: ['Unlockable pixel cars', 'Procedural traffic patterns', 'Weekly leaderboard events'],
      recommended: ['neon-drift', 'galactic-runner', 'synthwave-rider']
    },
    {
      slug: 'puzzle-nexus',
      title: 'Puzzle Nexus',
      shortDescription: 'Flux through dimensional tiles that rotate each time you tap them — align the network to win.',
      description:
        'Puzzle Nexus is a calming yet cerebral portal network puzzle. Rotate neon junctions, route energy beams and collapse the grid using as few moves as possible before the anomaly timer expires.',
      categories: ['Puzzle', 'Logic'],
      tags: ['brain teaser', 'minimalist', 'relaxing'],
      releaseDate: '2024-02-20',
      rating: 4.8,
      playTime: '2-6 min per puzzle',
      cover: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
      hero: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
      screenshots: [
        'https://images.unsplash.com/photo-1526498460520-4c246339dccb?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80'
      ],
      embedUrl: '/assets/playables/puzzle.html?label=Puzzle%20Nexus&palette=emerald&size=4',
      playUrl: '/assets/playables/puzzle.html?label=Puzzle%20Nexus&palette=emerald&size=4',
      controls: ['Click or tap tiles to rotate energy', 'Reset for a new layout'],
      platforms: ['Web Browser', 'Tablet'],
      developer: 'LumenBit',
      languages: ['English'],
      features: ['Hand-tuned grids', 'Move counter mastery', 'Ambient lo-fi soundtrack'],
      recommended: ['cosmic-blocks', 'rogue-chef', 'quantum-leap']
    },
    {
      slug: 'cosmic-blocks',
      title: 'Cosmic Blocks',
      shortDescription: 'Slide gravity-shifted blocks into orbital slots while managing limited moves.',
      description:
        'Cosmic Blocks fuses Sokoban-style pushing with gravity wells. Plan rotations, anticipate asteroid drifts and warp blocks into the right sockets to stabilize each space station.',
      categories: ['Puzzle', 'Strategy'],
      tags: ['sokoban', 'space', 'logic'],
      releaseDate: '2023-12-05',
      rating: 4.3,
      playTime: '5-8 min puzzles',
      cover: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80',
      hero: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1200&q=80',
      screenshots: [
        'https://images.unsplash.com/photo-1526498460520-4c246339dccb?auto=format&fit=crop&w=1200&q=80'
      ],
      embedUrl: '/assets/playables/puzzle.html?label=Cosmic%20Blocks&palette=violet&size=5',
      playUrl: '/assets/playables/puzzle.html?label=Cosmic%20Blocks&palette=violet&size=5',
      controls: ['Tap tiles to re-route gravity', 'Keep moves below par'],
      platforms: ['Web Browser'],
      developer: 'Orbital Puzzleworks',
      languages: ['English'],
      features: ['Gravity-flip mechanics', 'Daily featured puzzle', 'Speedrun challenges'],
      recommended: ['puzzle-nexus', 'rogue-chef']
    },
    {
      slug: 'sky-defense',
      title: 'Sky Defense Protocol',
      shortDescription: 'Intercept drones across shifting lanes and trigger EMP blasts to survive the sortie.',
      description:
        'Sky Defense Protocol is an arcade survival challenge. Cruise above cloud cities, slide across defense lanes and trigger EMP shields to neutralize incoming drones before they breach the perimeter.',
      categories: ['Action', 'Arcade'],
      tags: ['defense', 'endless', 'survival'],
      releaseDate: '2023-09-08',
      rating: 4.4,
      playTime: 'Fast survival rounds',
      cover: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
      hero: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1200&q=80',
      screenshots: [
        'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80'
      ],
      embedUrl: '/assets/playables/runner.html?label=Sky%20Defense&palette=azure&speed=1.18&shield=1',
      playUrl: '/assets/playables/runner.html?label=Sky%20Defense&palette=azure&speed=1.18&shield=1',
      controls: ['← → to switch lanes', 'Press Space to trigger EMP shield'],
      platforms: ['Web Browser'],
      developer: 'Nimbus Zero',
      languages: ['English'],
      features: ['Shield cooldown management', 'Boss waves every 90 seconds', 'Adaptive difficulty'],
      recommended: ['shadow-arena', 'galactic-runner']
    },
    {
      slug: 'rogue-chef',
      title: 'Rogue Chef Express',
      shortDescription: 'Harvest wild ingredients mid-run and cook power-ups on the fly in this cozy rogue-lite.',
      description:
        'Rogue Chef Express blends chill cooking vibes with rogue-lite runs. Dodge kitchen hazards, collect ingredients and serve combos to keep your pop-up sky diner open for another cycle.',
      categories: ['Casual', 'Simulation'],
      tags: ['cooking', 'roguelite', 'cute'],
      releaseDate: '2024-03-01',
      rating: 4.2,
      playTime: '4 min service loops',
      cover: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=1200&q=80',
      hero: 'https://images.unsplash.com/photo-1481833761820-0509d3217039?auto=format&fit=crop&w=1200&q=80',
      screenshots: [
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80'
      ],
      embedUrl: '/assets/playables/puzzle.html?label=Rogue%20Chef&palette=peach&size=4',
      playUrl: '/assets/playables/puzzle.html?label=Rogue%20Chef&palette=peach&size=4',
      controls: ['Tap ingredients in the right order', 'Beat the timer to unlock recipes'],
      platforms: ['Web Browser'],
      developer: 'Spice Route Studio',
      languages: ['English'],
      features: ['Daily menu challenges', 'Unlockable kitchen skins', 'Relaxed soundtrack'],
      recommended: ['puzzle-nexus', 'cosmic-blocks']
    },
    {
      slug: 'synthwave-rider',
      title: 'Synthwave Rider',
      shortDescription: 'Ride the rhythm with lane-switching set to pulsing 80s beats in a stylized highway.',
      description:
        'Synthwave Rider is a rhythmic racer where obstacles and score gates sync with the beat. Perfect timing adds remix layers while neon landscapes pulse to the soundtrack.',
      categories: ['Racing', 'Rhythm'],
      tags: ['music', 'endless', 'retro'],
      releaseDate: '2023-06-18',
      rating: 4.6,
      playTime: 'Song-length runs',
      cover: 'https://images.unsplash.com/photo-1523961131990-5ea7c61b2107?auto=format&fit=crop&w=1200&q=80',
      hero: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
      screenshots: [
        'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80'
      ],
      embedUrl: '/assets/playables/runner.html?label=Synthwave%20Rider&palette=magenta&speed=1.2',
      playUrl: '/assets/playables/runner.html?label=Synthwave%20Rider&palette=magenta&speed=1.2',
      controls: ['A/D or ← → to lane swap', 'Space to jump score gates'],
      platforms: ['Web Browser'],
      developer: 'RetroPulse',
      languages: ['English'],
      features: ['Beat-synced obstacles', 'Unlockable tracklist', 'Custom neon themes'],
      recommended: ['neon-drift', 'galactic-runner']
    },
    {
      slug: 'quantum-leap',
      title: 'Quantum Leap Trials',
      shortDescription: 'Bounce between realities using double jumps and time-slow portals to reach the exit.',
      description:
        'Quantum Leap Trials is a precision platformer distilled into snackable stages. Master double jumps, warp pads and time-slow bubbles to reach the portal before the anomaly collapses.',
      categories: ['Platformer', 'Adventure'],
      tags: ['precision', 'speedrun', 'sci-fi'],
      releaseDate: '2023-11-14',
      rating: 4.1,
      playTime: '30-90 sec stages',
      cover: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1200&q=80',
      hero: 'https://images.unsplash.com/photo-1526401485004-46910ecc8e51?auto=format&fit=crop&w=1200&q=80',
      screenshots: [
        'https://images.unsplash.com/photo-1472457897821-70d3819a0e24?auto=format&fit=crop&w=1200&q=80'
      ],
      embedUrl: '/assets/playables/runner.html?label=Quantum%20Leap&palette=teal&speed=1.05',
      playUrl: '/assets/playables/runner.html?label=Quantum%20Leap&palette=teal&speed=1.05',
      controls: ['← → to move', 'Space to phase jump'],
      platforms: ['Web Browser'],
      developer: 'Anomaly Labs',
      languages: ['English'],
      features: ['Speedrun medals', 'Phase shifting puzzles', 'Stage builder beta'],
      recommended: ['galactic-runner', 'sky-defense']
    },
    {
      slug: 'shadow-arena',
      title: 'Shadow Arena Tactics',
      shortDescription: 'Team-based arena fights with hero swapping, quick cooldowns and dramatic ultimates.',
      description:
        'Shadow Arena Tactics distills team arena combat into three-minute clashes. Swap heroes mid-round, control capture zones and trigger ultimates at just the right time to dominate.',
      categories: ['Action', 'Multiplayer'],
      tags: ['arena', 'competitive', 'teams'],
      releaseDate: '2024-03-30',
      rating: 4.9,
      playTime: '3 min rounds',
      cover: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80',
      hero: 'https://images.unsplash.com/photo-1526401485004-46910ecc8e51?auto=format&fit=crop&w=1200&q=80',
      screenshots: [
        'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80'
      ],
      embedUrl: '/assets/playables/runner.html?label=Shadow%20Arena&palette=crimson&speed=1.22&shield=1',
      playUrl: '/assets/playables/runner.html?label=Shadow%20Arena&palette=crimson&speed=1.22&shield=1',
      controls: ['← → to reposition', 'Space to trigger ultimate'],
      platforms: ['Web Browser'],
      developer: 'Eclipse Core',
      languages: ['English'],
      features: ['Hero swapping', 'Seasonal ladders', 'Spectator mode'],
      recommended: ['sky-defense', 'galactic-runner', 'quantum-leap']
    },
    {
      slug: 'super-mario-bros',
      title: '超级玛丽 (Super Mario Bros.)',
      shortDescription: 'Run, jump and stomp through the Mushroom Kingdom in the timeless NES classic.',
      description:
        'Relive the side-scrolling adventure that defined platformers. Sprint across overworlds, dive into underground caverns and topple Bowser’s castles as you rescue Princess Peach.',
      categories: ['Platformer', 'Retro'],
      tags: ['classic', 'platformer', 'retro'],
      releaseDate: '1985-09-13',
      rating: 4.9,
      playTime: 'Classic adventure campaign',
      cover: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92eee?auto=format&fit=crop&w=1200&q=80',
      hero: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92eee?auto=format&fit=crop&w=1200&q=80',
      screenshots: [
        'https://images.unsplash.com/photo-1587385789097-0197a7fbd019?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80'
      ],
      embedUrl: 'https://jcw87.github.io/c2-smb1/',
      playUrl: 'https://jcw87.github.io/c2-smb1/',
      controls: ['Arrow keys to move', 'Z to jump', 'X to dash/fire'],
      platforms: ['Web Browser'],
      developer: 'Nintendo',
      languages: ['English'],
      features: ['Faithful NES emulation', 'Hidden warp zones', 'Eight iconic worlds'],
      recommended: ['quantum-leap', 'galactic-runner']
    },
    {
      slug: 'magic-cube-plus',
      title: '魔方+ (3D Cube Puzzle)',
      shortDescription: 'Twist a playful 3D cube with custom animal stickers in a relaxing browser toy.',
      description:
        '魔方+ 让你在浏览器中随心旋转立体魔方。拖拽即可打乱或复原，彩色的动物贴纸和柔和背景让每一次转动都充满治愈感。',
      categories: ['Puzzle', 'Relaxing'],
      tags: ['cube', '3d', 'fidget'],
      releaseDate: '2022-07-01',
      rating: 4.2,
      playTime: 'Freeform fidgeting',
      cover: 'https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=1200&q=80',
      hero: 'https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=1200&q=80',
      screenshots: [
        'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80'
      ],
      embedUrl:
        'https://zoo-js.github.io/3dcube/?red=cat&white=dog&blue=pig&green=sheep&orange=koala&yellow=ant&bg=*ffd8bf',
      playUrl:
        'https://zoo-js.github.io/3dcube/?red=cat&white=dog&blue=pig&green=sheep&orange=koala&yellow=ant&bg=*ffd8bf',
      controls: ['Click and drag to rotate the cube', 'Scroll to zoom in or out'],
      platforms: ['Web Browser'],
      developer: 'ZOO.js',
      languages: ['English'],
      features: ['Customizable cube faces', 'Smooth WebGL animation', 'Relaxing ambient palette'],
      recommended: ['puzzle-nexus', 'cosmic-blocks']
    },
    {
      slug: 'freerider-carbon',
      title: '自行车（Free Rider HD: Carbon）',
      shortDescription: 'Balance a stickman rider through player-made tracks packed with loops and drops.',
      description:
        'Free Rider HD: Carbon 把物理特技骑行带到浏览器中。驾驭自行车穿越玩家创作的赛道，调整身形保持平衡，并在空中完成华丽动作。',
      categories: ['Racing', 'Physics'],
      tags: ['bike', 'physics', 'tracks'],
      releaseDate: '2014-05-01',
      rating: 4.6,
      playTime: 'Quick stunt runs',
      cover: 'https://images.unsplash.com/photo-1525104698733-6d38ce80f729?auto=format&fit=crop&w=1200&q=80',
      hero: 'https://images.unsplash.com/photo-1525104698733-6d38ce80f729?auto=format&fit=crop&w=1200&q=80',
      screenshots: [
        'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=1200&q=80'
      ],
      embedUrl: 'https://www.freeriderhd.com/game/1004698-carbon?embedded=true',
      playUrl: 'https://www.freeriderhd.com/game/1004698-carbon?embedded=true',
      controls: ['↑ to accelerate, ↓ to brake', '← → to lean', 'Z to reset position'],
      platforms: ['Web Browser'],
      developer: 'Kano Games',
      languages: ['English'],
      features: ['Thousands of community tracks', 'Physics-based stunts', 'Track editor integration'],
      recommended: ['neon-drift', 'galactic-runner']
    }
  ];

  const tools = [
    {
      slug: 'scenario',
      title: 'Scenario',
      description: 'Train custom AI models to generate production-ready game art, sprites and concept sheets.',
      url: 'https://www.scenario.com/',
      icon: 'https://assets.scenario.com/favicon-32x32.png',
      category: 'AI Tools',
      tags: ['ai art', 'concept art', 'sprites']
    },
    {
      slug: 'leonardo-ai',
      title: 'Leonardo.ai',
      description: 'Generate characters, props and worlds with controllable diffusion workflows tailored to games.',
      url: 'https://leonardo.ai/',
      icon: 'https://cdn.leonardo.ai/logos/favicon-32x32.png',
      category: 'AI Tools',
      tags: ['ai art', 'worldbuilding']
    },
    {
      slug: 'ludo-ai',
      title: 'Ludo.ai',
      description: 'Game concept research assistant that surfaces market trends, competitors and ideation prompts.',
      url: 'https://www.ludo.ai/',
      icon: 'https://www.ludo.ai/favicon-32x32.png',
      category: 'AI Tools',
      tags: ['market research', 'ideation']
    },
    {
      slug: 'gdevelop',
      title: 'GDevelop',
      description: 'Open-source, event-driven 2D game engine with instant web export, ideal for creators and students.',
      url: 'https://gdevelop.io/',
      icon: 'https://gdevelop.io/favicon-32x32.png',
      category: 'Game Tools',
      tags: ['engine', '2d']
    },
    {
      slug: 'construct3',
      title: 'Construct 3',
      description: 'Powerful browser-based game creator featuring visual scripting, physics and multi-platform export.',
      url: 'https://www.construct.net/en',
      icon: 'https://www.construct.net/favicon-32x32.png',
      category: 'Game Tools',
      tags: ['engine', 'visual scripting']
    },
    {
      slug: 'phaser',
      title: 'Phaser',
      description: 'Lightweight JavaScript framework for crafting HTML5 games with a vibrant plugin ecosystem.',
      url: 'https://phaser.io/',
      icon: 'https://phaser.io/favicon.ico',
      category: 'Game Tools',
      tags: ['javascript', 'framework']
    },
    {
      slug: 'godot',
      title: 'Godot Engine',
      description: 'MIT-licensed 2D and 3D engine with a thriving community, C# and GDScript support.',
      url: 'https://godotengine.org/',
      icon: 'https://godotengine.org/assets/press/icon_color.png',
      category: 'Game Tools',
      tags: ['open source', '3d']
    },
    {
      slug: 'itchio',
      title: 'itch.io',
      description: 'Indie game marketplace and jam community with generous revenue share and web embed support.',
      url: 'https://itch.io/',
      icon: 'https://itch.io/favicon.ico',
      category: 'Game Portals',
      tags: ['marketplace', 'jams']
    },
    {
      slug: 'crazygames',
      title: 'CrazyGames',
      description: 'Massive discovery portal for casual browser games with global reach and creator analytics.',
      url: 'https://www.crazygames.com/',
      icon: 'https://www.crazygames.com/favicon-32x32.png',
      category: 'Game Portals',
      tags: ['portal', 'analytics']
    },
    {
      slug: 'poki',
      title: 'Poki',
      description: 'Mobile-friendly browser arcade featuring curated indie titles and cross-platform publishing.',
      url: 'https://poki.com/',
      icon: 'https://images.poki.com/favicon-32x32.png',
      category: 'Game Portals',
      tags: ['portal', 'mobile']
    },
    {
      slug: 'kenney',
      title: 'Kenney Assets',
      description: 'Royalty-free 2D, 3D and audio asset packs for rapid prototyping and polished releases.',
      url: 'https://kenney.nl/assets',
      icon: 'https://kenney.nl/data/favicon/favicon-32.png',
      category: 'Gaming Resources',
      tags: ['assets', 'art']
    },
    {
      slug: 'gamedev-market',
      title: 'GameDev Market',
      description: 'Marketplace for premium sprites, tilesets, audio and UI kits ready for commercial use.',
      url: 'https://www.gamedevmarket.net/',
      icon: 'https://www.gamedevmarket.net/favicon-32x32.png',
      category: 'Gaming Resources',
      tags: ['assets', 'marketplace']
    },
    {
      slug: 'opengameart',
      title: 'OpenGameArt',
      description: 'Community-driven library of free and CC-licensed game assets spanning every genre.',
      url: 'https://opengameart.org/',
      icon: 'https://opengameart.org/sites/default/files/icon_16.png',
      category: 'Gaming Resources',
      tags: ['assets', 'community']
    },
    {
      slug: 'json-editor',
      title: 'JSON Viewer & Editor',
      description: 'Upload, inspect and edit JSON files with formatting, tree previews and one-click exports.',
      url: '/tools/json-editor/',
      icon: '/assets/icons/favicon.svg',
      category: 'Game Tools',
      tags: ['json', 'utilities']
    }
  ];

  const rankings = {
    top: ['super-mario-bros', 'shadow-arena', 'galactic-runner', 'puzzle-nexus', 'freerider-carbon'],
    new: ['magic-cube-plus', 'freerider-carbon', 'super-mario-bros', 'rogue-chef', 'puzzle-nexus'],
    trending: ['super-mario-bros', 'magic-cube-plus', 'freerider-carbon', 'galactic-runner', 'shadow-arena']
  };

  const categories = Array.from(
    new Set(
      games
        .map((game) => game.categories)
        .flat()
        .sort()
    )
  );

  const searchIndex = [
    ...games.map((game) => ({
      type: 'game',
      title: game.title,
      slug: game.slug,
      description: game.shortDescription,
      url: `/games/${game.slug}/`,
      tags: [...game.categories, ...game.tags]
    })),
    ...tools.map((tool) => {
      const isExternal = /^https?:/i.test(tool.url);
      return {
        type: 'tool',
        title: tool.title,
        slug: tool.slug,
        description: tool.description,
        url: tool.url,
        tags: [tool.category, ...(tool.tags || [])],
        external: isExternal
      };
    }),
    {
      type: 'page',
      title: 'Browsergame 精选',
      description: '即开即玩的浏览器小游戏清单，直接点击即可游玩或了解详情。',
      url: '/browsergame/',
      tags: ['browser games', '精选', '中文页面']
    }
  ];

  window.siteData = {
    games,
    tools,
    rankings,
    categories,
    site: {
      baseUrl: 'https://gameul.com/',
      name: 'GameUL'
    }
  };

  window.searchIndex = searchIndex;
})();
