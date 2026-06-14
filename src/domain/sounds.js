import audioFiles from 'virtual:audio-manifest';

function labelFromPath(path) {
  return path
    .split('/').pop()
    .replace('.mp3', '')
    .replace(/-/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());
}

function groupLabel(folder) {
  return folder.charAt(0).toUpperCase() + folder.slice(1);
}

const byGroup = {};
for (const path of audioFiles) {
  const folder = path.split('/')[0];
  if (!byGroup[folder]) byGroup[folder] = [];
  byGroup[folder].push({ label: labelFromPath(path), value: path });
}

export const SOUND_OPTION_GROUPS = Object.entries(byGroup).map(([folder, options]) => ({
  folder,
  group: groupLabel(folder),
  options,
}));

export const SOUND_OPTIONS = SOUND_OPTION_GROUPS.flatMap((g) => g.options);
