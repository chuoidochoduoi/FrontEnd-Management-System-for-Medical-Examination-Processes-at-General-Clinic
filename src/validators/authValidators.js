const isEmail = (value) => /\S+@\S+\.\S+/.test(value);

export const validators = {
  required: (value) => (value === undefined || value === null || value === '' ? 'Required' : undefined),
  email: (value) => (value && !isEmail(value) ? 'Invalid email' : undefined),
};

export function runValidators(value, list = []) {
  for (const v of list) {
    const fn = validators[v];
    if (!fn) continue;
    const err = fn(value);
    if (err) return err;
  }
  return undefined;
}

export default validators;
