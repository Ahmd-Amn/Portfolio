export const skillNames = (value: string) => value.split(/\r?\n/).map(name => name.trim()).filter(Boolean)
