// A book's external_id is an OpenLibrary work key, or a Google Books volume
// id for books OpenLibrary doesn't have
export const isOpenLibraryKey = (id: string) => /^\/works\/OL\d+W$/.test(id);
export const isGoogleVolumeId = (id: string) => /^[\w-]{12}$/.test(id);
