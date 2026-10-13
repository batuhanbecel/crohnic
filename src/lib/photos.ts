import { Directory, File, Paths } from 'expo-file-system';

// Only the file name is stored in the database; the app container path changes between iOS updates.
function photosDir() {
  const dir = new Directory(Paths.document, 'photos');
  if (!dir.exists) dir.create({ idempotent: true, intermediates: true });
  return dir;
}

export function savePhoto(srcUri: string): string {
  const name = `meal-${Date.now()}-${Math.round(Math.random() * 1e6)}.jpg`;
  new File(srcUri).copySync(new File(photosDir(), name));
  return name;
}

export function photoUri(name: string | null | undefined): string | null {
  if (!name) return null;
  return new File(photosDir(), name).uri;
}

export function deletePhoto(name: string | null | undefined) {
  if (!name) return;
  try {
    const f = new File(photosDir(), name);
    if (f.exists) f.delete();
  } catch {
    // ignore
  }
}
