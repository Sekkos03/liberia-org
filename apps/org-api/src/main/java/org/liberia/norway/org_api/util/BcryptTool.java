package org.liberia.norway.org_api.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class BcryptTool {
  public static void main(String[] args) {
    String pwd = args.length > 0 ? args[0] : "LIBulan@1847";
    var enc = new BCryptPasswordEncoder();          // strength 10 (default). Use new BCryptPasswordEncoder(12) for stronger.
    System.out.println(enc.encode(pwd));            // prints the bcrypt hash
  }
}
