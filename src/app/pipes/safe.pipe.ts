import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml, SafeResourceUrl, SafeScript, SafeStyle, SafeUrl } from '@angular/platform-browser';

@Pipe({
  name: 'safe'
})
export class SafePipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string | SafeResourceUrl | null): SafeResourceUrl {
    if (!value) {
      return this.sanitizer.bypassSecurityTrustResourceUrl('');
    }
    
    // If it's already a SafeResourceUrl, return it directly
    if (typeof value === 'object') {
      return value as SafeResourceUrl;
    }
    
    // Otherwise, sanitize the string
    return this.sanitizer.bypassSecurityTrustResourceUrl(value);
  }
}
