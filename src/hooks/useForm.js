import { useState } from 'react';
import { runValidators } from '../validators/authValidators';

export function useForm({ initialValues = {}, fields = [], onSubmit } = {}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function validateField(name, value) {
    const field = fields.find(f => f.name === name);
    if (!field) return undefined;
    return runValidators(value, field.validators || []);
  }

  function handleChange(name, value) {
    setValues(v => ({ ...v, [name]: value }));
    setErrors(e => ({ ...e, [name]: validateField(name, value) }));
  }

  async function handleSubmit(evt) {
    if (evt && evt.preventDefault) evt.preventDefault();
    const nextErrors = {};
    for (const f of fields) {
      const err = runValidators(values[f.name], f.validators || []);
      if (err) nextErrors[f.name] = err;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setSubmitting(false);
    }
  }

  return { values, errors, submitting, handleChange, handleSubmit, setValues, setErrors };
}

export default useForm;
