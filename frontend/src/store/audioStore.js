/**
 * Module-level audio store — survives React Router navigation within the same tab.
 * Stores the recorded/uploaded audio blob and metadata so the user can always
 * navigate back to Step 1 and find their audio still loaded.
 */

let _blob     = null;
let _url      = null;
let _name     = null;
let _size     = null;

export const saveAudio = (blob, url, name, size) => {
  _blob = blob;
  _url  = url;
  _name = name;
  _size = size;
};

export const getAudio = () =>
  _blob ? { blob: _blob, url: _url, name: _name, size: _size } : null;

export const clearAudio = () => {
  if (_url) URL.revokeObjectURL(_url);
  _blob = null;
  _url  = null;
  _name = null;
  _size = null;
};
