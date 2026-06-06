export interface FacebookCookieValues {
  fbp?: string;
  fbc?: string;
}

const getCookieValue = (cookieName: string, cookieHeader?: string): string | undefined => {
  if (!cookieHeader) return undefined;

  const prefixedCookie = cookieHeader
    .split('; ')
    .find((cookie) => cookie.startsWith(`${cookieName}=`));

  if (!prefixedCookie) return undefined;

  const rawValue = prefixedCookie.slice(cookieName.length + 1);
  return rawValue ? decodeURIComponent(rawValue) : undefined;
};

export const getFacebookCookieValues = (cookieHeader?: string): FacebookCookieValues => {
  const fbp = getCookieValue('_fbp', cookieHeader);
  const fbc = getCookieValue('_fbc', cookieHeader);

  return {
    ...(fbp ? { fbp } : {}),
    ...(fbc ? { fbc } : {}),
  };
};
