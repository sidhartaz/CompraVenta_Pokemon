function slugifyBase(text) {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

async function generateUniqueSlug(ListingModel, name, excludeId = null) {
  const base = slugifyBase(name) || 'publicacion';
  let candidate = base;
  let suffix = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await ListingModel.findOne({
      slug: candidate,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    })
      .select('_id')
      .lean();

    if (!existing) {
      return candidate;
    }

    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

module.exports = {
  generateUniqueSlug,
};
