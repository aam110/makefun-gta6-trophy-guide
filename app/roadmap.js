// The platinum roadmap: three stages built from the official descriptions and
// the public guide consensus (GTABase, PowerPyx, GTA Vibes). Each stage lists
// the trophies it covers, so the roadmap and the checklist always agree.

export const ROADMAP_STAGES = [
  {
    number: 1,
    title: 'Play the story',
    hours: 'Roughly 60–80 hours',
    blurb:
      'Play the five chapters and take optional missions as they appear. ' +
      'Chapter trophies, mission trophies and the character strands all land ' +
      'here, and the duo trophies open up once both protagonists are playable.',
    items: [
      'Chapters 1–5 and the final mission (7 trophies)',
      'Named missions: Gone Fishing to Operation Savage Glory',
      'Lucia’s balcony meditation — the one missable spot',
      'Duo trophies: Hot Together, Retail Therapy, Gunslinger',
      'Try all 9 activity types for Master of None',
    ],
    trophyIds: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 16, 20, 21, 28, 33, 34, 36, 44, 46, 47, 48, 49],
  },
  {
    number: 2,
    title: 'The 100% sweep',
    hours: 'Roughly 100 hours',
    blurb:
      'After the credits, open Progress > Stats > 100% Completion and work the ' +
      'checklist region by region. The thresholds are lenient — about 200 of ' +
      '277 vehicles, 100 of 255 animals, 50 of 66 weapons, 70 of 80 challenges.',
    items: [
      'A Long Road: the 100% checklist itself',
      '250 stunts, 42 shooting-range golds, 14 drone races',
      '5 bank vaults, armored trucks, 9 gang operations',
      'Cards, WAiNK It spots, meditation spots, garages',
      'Launder $250,000 in Marked Bills; spend $100,000',
    ],
    trophyIds: [14, 15, 17, 18, 19, 30, 31, 32, 35, 37, 38, 39, 40, 41, 42, 43, 45, 50, 51, 52, 53, 54, 55],
  },
  {
    number: 3,
    title: 'Strangers & cleanup',
    hours: 'Roughly 10 hours',
    blurb:
      'Finish the stranger strands and character quests, then sweep up whatever ' +
      'the checklist still shows. The platinum pops the moment the last ' +
      'trophy does — usually right after A Long Road.',
    items: [
      'Strangers & Freaks: 8 full stranger strands',
      'Final missions for Andy, Kenton, Billy, Randy, Tyrone',
      'Bret’s unique animal hunt',
      'Any stragglers from stages 1 and 2',
    ],
    trophyIds: [1, 22, 23, 24, 25, 26, 27, 29],
  },
];

export function stageOf(trophyId) {
  for (const stage of ROADMAP_STAGES) {
    if (stage.trophyIds.includes(trophyId)) return stage.number;
  }
  return 2;
}

export function renderRoadmap(container, earnedNames, trophiesById) {
  container.replaceChildren();
  for (const stage of ROADMAP_STAGES) {
    const card = document.createElement('article');
    card.className = 'stage';

    const num = document.createElement('p');
    num.className = 'stage-num';
    num.textContent = `Stage ${stage.number}`;
    card.append(num);

    const title = document.createElement('h3');
    title.textContent = stage.title;
    card.append(title);

    const hours = document.createElement('p');
    hours.className = 'hours';
    hours.textContent = stage.hours;
    card.append(hours);

    const blurb = document.createElement('p');
    blurb.textContent = stage.blurb;
    card.append(blurb);

    const list = document.createElement('ul');
    list.className = 'stage-trophies';
    for (const item of stage.items) {
      const li = document.createElement('li');
      li.textContent = item;
      list.append(li);
    }
    card.append(list);

    const done = stage.trophyIds.filter((id) => earnedNames.has(trophiesById.get(id).name)).length;
    const count = document.createElement('span');
    count.className = 'stage-count';
    count.textContent = `${done} of ${stage.trophyIds.length} trophies earned`;
    card.append(count);

    container.append(card);
  }
}
