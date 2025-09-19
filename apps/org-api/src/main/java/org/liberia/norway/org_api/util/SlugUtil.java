package org.liberia.norway.org_api.util;

public final class SlugUtil {
  private SlugUtil() {}
  public static String slugify(String s) {
    if (s == null) return null;
    var slug = s.trim().toLowerCase()
      .replaceAll("[^a-z0-9\\s-]", "")
      .replaceAll("\\s+", "-")
      .replaceAll("-{2,}", "-");
    return slug.isBlank() ? null : slug;
  }
}
