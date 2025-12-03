function stripContactInfo(listing) {
  if (!listing) return listing;
  const { contactWhatsapp, ...rest } = listing;
  return rest;
}

module.exports = { stripContactInfo };
