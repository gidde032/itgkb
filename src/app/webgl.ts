/**
 * Feature detection for the 3D showcase view (#31 decision 7): the 3D segment
 * of the view-mode control is disabled, with a note, when WebGL is missing.
 */
export function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}
