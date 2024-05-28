import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { Link, Selection, Simulation, forceCenter } from 'd3';
import { Subject, takeUntil } from 'rxjs';
import { BreakpointService } from 'src/app/services/breakpoint.service';
import { ChartDataService } from 'src/app/services/chart-data.service';

@Component({
  selector: 'app-force-graph',
  templateUrl: './force-graph.component.html',
  styleUrl: './force-graph.component.scss',
})
export class ForceGraphComponent implements OnDestroy, AfterViewInit {
  @ViewChild('graphContainer') graphContainer!: ElementRef;
  private svg!: Selection<SVGSVGElement, unknown, null, undefined>;
  private simulation!: Simulation<Node, Link>;
  private componetDestroyed = new Subject<void>();

  private chartDataService = inject(ChartDataService);
  private breakpointService = inject(BreakpointService);

  ngAfterViewInit(): void {
    this.chartDataService.persons2Subject.subscribe((res) => {
      if (res.length !== 0) {
        this.initializeGraph();
      }
    });

    this.chartDataService.graphConfiguration.subscribe((res) => {
      if (this.chartDataService.persons2Subject.value.length !== 0) {
        this.initializeGraph();
      }
    });

    this.breakpointService.proportion.subscribe({
      next: (res) => {
        if (this.chartDataService.persons2Subject.value.length !== 0) {
          this.initializeGraph();
        }
      },
      error: (err) => {
        // console.log(err);
      },
    });
  }

  ngOnDestroy(): void {
    this.componetDestroyed.next();
    this.componetDestroyed.unsubscribe();
  }

  initializeGraph() {
    this.chartDataService
      .getChartData()
      .pipe(takeUntil(this.componetDestroyed))
      .subscribe({
        next: (data: { nodes: Node[]; links: Link[] }) => {
          this.createGraph(data);
        },
        error: (error) => {
          // console.error('Error fetching chart data:', error);
        },
      });
  }

  /**
   * Create Graph & Adjust SVG Height,Width & View Box
   */
  createGraph(data: { nodes: Node[]; links: Link[] }): void {
    const div: HTMLDivElement = this.graphContainer.nativeElement;
    const width: number = div.clientWidth;
    const height: number = div.clientHeight;
    const { svg, simulation } = this.chartDataService.createGraph(div, width, height, data);

    this.svg = svg;
    this.simulation = simulation;
    this.updateGraph();
  }

  /**
   * Update Graph View Box
   */
  updateGraph(): void {
    const div: HTMLDivElement = this.graphContainer.nativeElement;
    const width: number = div.clientWidth;
    const height: number = div.clientHeight;
    this.svg.attr('viewBox', `0 0 ${width} ${height}`);
    this.simulation.force('center', forceCenter<Node>(width / 2, height / 2));

    this.simulation.alpha(1).restart(); // Restart simulation
  }

  get persons() {
    return this.chartDataService.persons2Subject.getValue();
  }
}
