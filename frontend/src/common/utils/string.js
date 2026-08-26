export const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

export const truncate = (str, maxLength) =>
    str && str.length > maxLength ? `${str.slice(0, maxLength).trimEnd()}...` : str;
