import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BreakpointService {
  public breakpointObserver = inject(BreakpointObserver);
  public proportion: BehaviorSubject<number> = new BehaviorSubject<number>(0);

  displayNameMap = new Map([
    [Breakpoints.XSmall, 0.5],
    [Breakpoints.Small, 0.6],
    [Breakpoints.Medium, 0.7],
    [Breakpoints.Large, 0.8],
    [Breakpoints.XLarge, 1],
  ]);

  constructor() {
    this.breakpointObserver.observe([Breakpoints.XSmall, Breakpoints.Small, Breakpoints.Medium, Breakpoints.Large, Breakpoints.XLarge]).subscribe((result) => {
      for (const query of Object.keys(result.breakpoints)) {
        if (result.breakpoints[query]) {
          this.proportion.next(this.displayNameMap.get(query));
        }
      }
    });
  }
}
