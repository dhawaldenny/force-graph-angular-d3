import { Injectable, inject } from '@angular/core';
import { BaseType, Link, Node, Selection, Simulation, drag, forceLink, forceManyBody, forceSimulation, select } from 'd3';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { CHART_OPTIONS } from '../data/chart-options';
import { personNames, personQualities } from '../data/constants';
import { NodeType, Sign } from '../enums';
import { GraphConfiguration, Person2 } from '../interfaces';
import { BreakpointService } from './breakpoint.service';
import { UtilsService } from './utils.service';

@Injectable({
  providedIn: 'root',
})
export class ChartDataService {
  private US = inject(UtilsService);

  private persons2Shown: Person2[] = [];
  private persons2Created: Person2[] = [];
  public persons2Subject: BehaviorSubject<Person2[]> = new BehaviorSubject<Person2[]>([]);

  private breakpointService = inject(BreakpointService);
  public proportion = 1;

  private rangeAttributes = 10;
  private rangeWeight = 5;
  private auraReduced = 8;
  private distanceProportion = 1;

  public attributesSelected: BehaviorSubject<string[]> = new BehaviorSubject<string[]>(personQualities);

  public graphConfiguration: BehaviorSubject<GraphConfiguration> = new BehaviorSubject<GraphConfiguration>({
    idPersonSelected: 0,
    /**
     * From 0 to 4
     */
    personsDistanceProportion: 2.5,
    /**
     * From 0 to 1
     */
    attributesDistanceProportion: 0.7,
    /**
     * From 0 to 1
     */
    opacityAura: 1,
    /**
     * From 10 to 100,
     */
    percentDefinedAttributes: 70,
    /**
     * From 5 to 100,
     */
    strengthGraph: 10,
    /**
     * From 5 to 250,
     */
    maxAuraRadio: 200,
    /**
     * From 4 to 10,
     */
    valueAttributeNode: 4,
    fullColorAttributeNodes: true,
    showNames: true,
  });

  get idPersonSelected() {
    return this.graphConfiguration.value.idPersonSelected;
  }
  get personsDistanceProportion() {
    return this.graphConfiguration.value.personsDistanceProportion;
  }
  get attributesDistanceProportion() {
    return this.graphConfiguration.value.attributesDistanceProportion;
  }
  get opacityAura() {
    return this.graphConfiguration.value.opacityAura;
  }
  get percentDefinedAttributes() {
    return this.graphConfiguration.value.percentDefinedAttributes;
  }
  get strengthGraph() {
    return this.graphConfiguration.value.strengthGraph;
  }
  get maxAuraRadio() {
    return this.graphConfiguration.value.maxAuraRadio;
  }
  get valueAttributeNode() {
    return this.graphConfiguration.value.valueAttributeNode;
  }
  get fullColorAttributeNodes() {
    return this.graphConfiguration.value.fullColorAttributeNodes;
  }
  get showNames() {
    return this.graphConfiguration.value.showNames;
  }

  

  addPerson(nodeGroupAmount: number = 2, percentDefinedAttributes: number = 100, attributesList: string[]) {
    const newNumberPersons = Math.floor(nodeGroupAmount);
    const currentNumberPersons = this.persons2Created.length;

    if (newNumberPersons < 2) return;

    const differenceNumber = newNumberPersons - currentNumberPersons;
    const sameAttributes = this.US.arraysHaveSameElements(attributesList, this.attributesSelected.value);
    if (!sameAttributes) {
      // console.log('new');
      const newPersons = this.loopCreatePersons(newNumberPersons, percentDefinedAttributes, attributesList, true);
      this.attributesSelected.next(attributesList);
      this.persons2Created = newPersons;
      this.persons2Shown = this.persons2Created;
    } else if (percentDefinedAttributes !== this.percentDefinedAttributes) {
      // console.log('new');
      const newPersons = this.loopCreatePersons(newNumberPersons, percentDefinedAttributes, attributesList, true);
      this.persons2Created = newPersons;
      this.persons2Shown = this.persons2Created;
    } else if (differenceNumber === 0) {
      // console.log('slice');
      this.persons2Shown = this.persons2Created.slice(0, newNumberPersons);
    } else if (differenceNumber > 0) {
      // console.log('add');
      const newPersons = this.loopCreatePersons(differenceNumber, this.percentDefinedAttributes, attributesList, false);
      this.persons2Created = [...this.persons2Created, ...newPersons];
      this.persons2Shown = this.persons2Created;
    } else {
      // console.log('else');
      this.persons2Shown = this.persons2Created.slice(0, newNumberPersons);
    }

    this.persons2Subject.next(this.persons2Shown);
  }

  loopCreatePersons(number: number, percentDefinedAttributes: number, attributesList: string[], isNew: boolean) {
    const persons2Created: Person2[] = [];

    let counterId = isNew ? 0 : this.persons2Created.length;

    for (let i = 0; i < number; i++) {
      const name: string = personNames[this.US.randomNumber(personNames.length, false)] + ` (${this.US.randomNumber(10) + 18})`;
      const id = counterId;

      const attributes = {};
      const preferences = {};

      for (let j = 0; j < attributesList.length; j++) {
        const attributeName = attributesList[j];
        if (this.US.randomBoolean(percentDefinedAttributes)) {
          attributes[attributeName] = this.US.randomNumber(this.rangeAttributes);
        }
        preferences[attributeName] = {
          value: this.US.randomNumber(this.rangeAttributes),
          sign: this.US.randomSign(),
          weight: this.US.randomNumber(this.rangeWeight),
        };
      }

      const personalAuraRadio = (this.maxAuraRadio * Object.keys(attributes).length) / attributesList.length;

      persons2Created.push({
        id,
        name,
        attributes,
        preferences,
        personalAuraRadio,
      });

      counterId += 1;
    }

    return persons2Created;
  }

  constructor() {
    this.proportion = this.breakpointService.proportion.getValue();
  }

  /**
   * Generate Chart Data
   * @returns nodes and links using the persons data from the BehaviorSubject
   */
  public getChartData(): Observable<{ nodes: Node[]; links: Link[] }> {
    const nodes: Node[] = [];
    const links: Link[] = [];

    const person = this.persons2Shown.find((p) => p.id === this.idPersonSelected);
    const personsNotSelected = this.persons2Shown.filter((p) => p.id !== this.idPersonSelected);

    const relationsData = {};
    const selectedData = {
      id: person.id,
      name: person.name,
      attributes: {},
    };
    for (let a = 0; a < personsNotSelected.length; a++) {
      relationsData[personsNotSelected[a].id] = {};
    }

    for (let i = 0; i < personsNotSelected.length; i++) {
      for (const attribute of personQualities) {
        if (personsNotSelected[i].attributes[attribute]) {
          const sign: Sign = person.preferences[attribute].sign;

          let attraction: number = 0;

          const preferenceValue: number = person.preferences[attribute].value;
          const attributevalue: number = personsNotSelected[i].attributes[attribute];

          const isGreater: boolean = preferenceValue < attributevalue;
          const isLesser: boolean = preferenceValue > attributevalue;
          const isExact: boolean = preferenceValue === attributevalue;

          if (sign === Sign.GREATER && isGreater) {
            attraction = person.preferences[attribute].weight;
            relationsData[personsNotSelected[i].id][attribute] = attraction;
          } else if (sign === Sign.LESSER && isLesser) {
            attraction = person.preferences[attribute].weight;
            relationsData[personsNotSelected[i].id][attribute] = attraction;
          } else if (sign === Sign.EXACT && isExact) {
            attraction = person.preferences[attribute].weight;
            relationsData[personsNotSelected[i].id][attribute] = attraction;
          } else {
            relationsData[personsNotSelected[i].id][attribute] = 0;
          }

          if (sign === Sign.CLOSER) {
            const separationUnt: number = person.preferences[attribute].weight / (this.rangeAttributes - 1);

            const distanceInt: number = preferenceValue - attributevalue;

            const distanceDouble: number = Math.abs(distanceInt) * separationUnt;

            attraction = Math.floor((person.preferences[attribute].weight - distanceDouble) * 100) / 100;

            relationsData[personsNotSelected[i].id][attribute] = attraction;
          }

          if (selectedData.attributes[attribute]) {
            selectedData.attributes[attribute] += attraction;
          } else {
            selectedData.attributes[attribute] = attraction;
          }
        } else {
          relationsData[personsNotSelected[i].id][attribute] = 0;
          if (!selectedData.attributes[attribute]) {
            selectedData.attributes[attribute] = 0;
          }
        }
      }
    }

    const linksRelationsAttributes: Link[] = [];
    const linksPersons: Link[] = [];
    const nodesPersons: Node[] = [];
    const nodesAttributes: Node[] = [];
    let maxDistanceRelations: number = 0;

    for (const idPerson in relationsData) {
      if (Object.prototype.hasOwnProperty.call(relationsData, idPerson)) {
        // for distance between persons purpose
        let sumAttractions: number = 0;

        let maxDistanceAttributePerson: number = 0;
        let minDistanceAttributePerson: number = 1000;
        // for each person
        for (const attribute in relationsData[idPerson]) {
          if (Object.prototype.hasOwnProperty.call(relationsData[idPerson], attribute)) {
            const distance = relationsData[idPerson][attribute] * 10 + this.maxAuraRadio / this.auraReduced;

            linksRelationsAttributes.push({
              source: idPerson,
              target: `${idPerson}_${attribute}`,
              light: false,
              distance: 20,
            });

            linksRelationsAttributes.push({
              source: `${attribute}`,
              target: `${idPerson}_${attribute}`,
              light: false,
              distance: distance,
            });

            for (const targetIdPerson in relationsData) {
              const distance1 = relationsData[targetIdPerson][attribute] * 10 + this.maxAuraRadio / this.auraReduced;
              linksRelationsAttributes.push({
                source: `${idPerson}_${attribute}`,
                target: `${targetIdPerson}_${attribute}`,
                light: false,
                distance: distance1,
              });

              // linksRelationsAttributes.push({
              //   source: `${targetIdPerson}_${attribute}`,
              //   target: `${selectedData.id}_${attribute}`,
              //   light: false,
              //   distance: 20,
              // });
            }

            if (distance > maxDistanceRelations) maxDistanceRelations = distance;

            if (relationsData[idPerson][attribute] > maxDistanceAttributePerson) maxDistanceAttributePerson = relationsData[idPerson][attribute];
            if (relationsData[idPerson][attribute] < minDistanceAttributePerson) minDistanceAttributePerson = relationsData[idPerson][attribute];

            sumAttractions += relationsData[idPerson][attribute];
          }
        }

        // get color for Attribute Node
        for (const attribute in relationsData[idPerson]) {
          if (Object.prototype.hasOwnProperty.call(relationsData[idPerson], attribute)) {
            // for each attribute per person there'll be a node
            nodesAttributes.push({
              id: `${idPerson}_${attribute}`,
              name: attribute,
              value: this.valueAttributeNode * this.proportion,
              color: this.US.getColorAttributeNode(relationsData[idPerson][attribute], maxDistanceAttributePerson, minDistanceAttributePerson, 1),
              colorAura: this.US.getColorAttributeNode(relationsData[idPerson][attribute], maxDistanceAttributePerson, minDistanceAttributePerson, 1),
              fullColor: this.fullColorAttributeNodes,
              personId: idPerson,
            });
          }
        }

        // links from other persons to selected person

        linksPersons.push({
          source: idPerson,
          target: selectedData.id,
          light: false,
          distance: 200,
        });

        nodesPersons.push({
          id: idPerson,
          name: personsNotSelected.find((p) => p.id === +idPerson).name,
          color: '#FFC500',
          value: personsNotSelected.find((p) => p.id === +idPerson).personalAuraRadio * this.proportion,
        });
      }
    }

    let maxDistancePersons: number = 0;
    let minDistancePersons: number = 1000;
    for (let i = 0; i < linksPersons.length; i++) {
      const distance = linksPersons[i].distance;
      if (distance > maxDistancePersons) maxDistancePersons = distance;
      if (distance < minDistancePersons) minDistancePersons = distance;
    }

    for (let i = 0; i < linksPersons.length; i++) {
      const newDistance = this.US.getDistancePersonNode(linksPersons[i].distance, maxDistancePersons, minDistancePersons, this.personsDistanceProportion);
      // links.push({
      //   ...linksPersons[i],
      //   distance: newDistance * this.proportion,
      // });
    }
    for (let i = 0; i < nodesPersons.length; i++) {
      const realDistance = linksPersons[i].distance;
      const realMaxDistance = maxDistancePersons;
      const realMinDistance = minDistancePersons;

      nodes.push({
        ...nodesPersons[i],
        colorAura: this.US.getColorPersonNode(realDistance, realMaxDistance, realMinDistance, this.opacityAura),
        fullColor: false,
        color: this.US.getColorPersonNode(realDistance, realMaxDistance, realMinDistance, this.opacityAura),
        personId: undefined,
        type: NodeType.PERSON,
      });
    }

    for (let i = 0; i < linksRelationsAttributes.length; i++) {
      links.push({
        ...linksRelationsAttributes[i],
        distance: ((linksRelationsAttributes[i].distance * this.maxAuraRadio * this.attributesDistanceProportion) / maxDistanceRelations) * this.proportion,
      });
    }

    // Selected person
    nodes.push({
      id: selectedData.id,
      name: selectedData.name,
      color: `rgb(255, 0, 166, ${this.opacityAura})`,
      fullColor: false,
      colorAura: `rgb(255, 0, 166, ${this.opacityAura})`,
      value: this.maxAuraRadio * this.proportion,
      personId: undefined,
      type: NodeType.PERSON,
    });

    const linksSelectedAttributes: Link[] = [];
    let maxDistanceSelected: number = 0;
    let minDistanceSelected: number = 1000;

    for (const key in selectedData.attributes) {
      if (Object.prototype.hasOwnProperty.call(selectedData.attributes, key)) {
        const distance = selectedData.attributes[key] * 10 + this.maxAuraRadio / this.auraReduced;

        linksSelectedAttributes.push({
          source: key,
          target: selectedData.id,
          light: false,
          distance: distance,
        });

        if (distance > maxDistanceSelected) maxDistanceSelected = distance;
        if (distance < minDistanceSelected) minDistanceSelected = distance;
      }
    }

    for (let i = 0; i < linksSelectedAttributes.length; i++) {
      links.push({
        ...linksSelectedAttributes[i],
        distance: ((linksSelectedAttributes[i].distance * this.maxAuraRadio * this.attributesDistanceProportion) / maxDistanceSelected) * this.proportion,
      });
    }

    for (const key in selectedData.attributes) {
      if (Object.prototype.hasOwnProperty.call(selectedData.attributes, key)) {
        const distance = selectedData.attributes[key] * 10 + this.maxAuraRadio / this.auraReduced;

        nodes.push({
          id: key,
          name: key,
          value: this.valueAttributeNode * this.proportion,
          color: this.US.getColorAttributeNode(distance, maxDistanceSelected, minDistanceSelected, 1, true),
          colorAura: this.US.getColorAttributeNode(distance, maxDistanceSelected, minDistanceSelected, 1, true),
          fullColor: this.fullColorAttributeNodes,
          personId: selectedData.id,
          type: NodeType.ATTRIBUTE,
        });
      }
    }

    // nodes others attributes
    for (let i = 0; i < nodesAttributes.length; i++) {
      nodes.push({
        ...nodesAttributes[i],
        type: NodeType.ATTRIBUTE,
      });
    }

    // console.table(relationsData);
    // console.table(selectedData.attributes);
    // console.table(person.preferences);
    return of({ nodes, links });
  }

  /**
   * Create Graph & Adjust SVG Height,Width & View Box
   */
  public createGraph(
    div: HTMLDivElement,
    width: number,
    height: number,
    data: { nodes: Node[]; links: Link[] },
  ): { svg: Selection<SVGSVGElement, unknown, null, undefined>; simulation: Simulation<Node, Link> } {
    select('svg').remove();

    const svg = select(div).append('svg').attr('viewBox', `0 0 ${width} ${height}`).attr('preserveAspectRatio', 'xMidYMid meet');

    const link: Selection<SVGLineElement, Link, BaseType, unknown> = svg
      .append('g')
      .attr('stroke', CHART_OPTIONS.linkColor)
      .attr('stroke-opacity', 1)
      .selectAll('line')
      .data(data.links)
      .join('line')
      .attr('class', 'links');

    const node: Selection<SVGGElement, Node, BaseType, unknown> = svg
      .append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(data.nodes)
      .enter()
      .append('g')
      .call(
        drag()
          .on('start', (e, d, s) => {
            this.dragStart(e, d, simulation);
            link
              .attr('display', 'none')
              .filter((l) => l.source.id === d.id || l.target.id === d.id)
              .attr('display', 'block')
              .attr('stroke', 'white');

            text
              .filter((n) => {
                return n.type === NodeType.ATTRIBUTE && n.personId === d.id;
              })
              .style('fill', 'white');

            text.filter((n) => n.type === NodeType.ATTRIBUTE && n.id === d.id).style('fill', 'white');
          })
          .on('drag', (e, d, s) => {
            this.drag(e, d, simulation);
            link
              .attr('display', 'none')
              .filter((l) => l.source.id === d.id || l.target.id === d.id)
              .attr('display', 'block')
              .attr('stroke', 'white');

            text
              .filter((n) => {
                return n.type === NodeType.ATTRIBUTE && n.personId === d.id;
              })
              .style('fill', 'white');

            text.filter((n) => n.type === NodeType.ATTRIBUTE && n.id === d.id).style('fill', 'white');
          })
          .on('end', (e, d, s) => {
            this.dragEnd(e, d, simulation);
            link.attr('display', 'block').attr('stroke', CHART_OPTIONS.linkColor);
            text.filter((n) => n.type === NodeType.ATTRIBUTE && n.personId === d.id).style('fill', 'transparent');
            text.filter((n) => n.type === NodeType.ATTRIBUTE && n.id === d.id).style('fill', 'transparent');
          }),
      );

    const circles: Selection<SVGCircleElement, Node, BaseType, unknown> = node.append('g').style('cursor', 'pointer');

    circles
      .append('circle')
      .attr('r', (d) => d.value)
      .style('fill', (d) => (d.fullColor ? d.color : 'transparent'));

    const gradient: Selection<SVGStopElement, unknown, BaseType, unknown> = circles
      .append('radialGradient')
      .attr('id', (d, i) => (d.fullColor ? `glare-gradient-${i}` : ''))
      .attr('cx', '70%')
      .attr('cy', '70%')
      .attr('r', '80%');

    gradient.append('stop').attr('offset', '0%').style('stop-color', CHART_OPTIONS.gradientColor).style('stop-opacity', 1);

    gradient.append('stop').attr('offset', '100%').style('stop-color', CHART_OPTIONS.gradientShade);

    const gradientOut: Selection<SVGStopElement, unknown, BaseType, unknown> = circles
      .append('radialGradient')
      .attr('id', (d, i) => (d.fullColor ? '' : `gradient-out-${i}`))
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '0%');

    gradientOut
      .append('stop')
      .attr('offset', '0%')
      .style('stop-color', (n) => n.colorAura)
      .style('stop-opacity', 1);

    gradientOut.append('stop').attr('offset', '100%').style('stop-color', 'transparent');

    circles
  .append('circle')
  .attr('r', (d) => d.value)
  .style('fill', (d) => (d.fullColor ? d.color : 'transparent'))
  .style('filter', (d) => {
    const nearbyNodes = data.nodes.filter((node) => {
      return Math.sqrt((node.x - d.x) ** 2 + (node.y - d.y) ** 2) <= 100;
    });
    const auraStrength = nearbyNodes.length * 5; 
    return `url(#glare-gradient-${auraStrength})`;
  });
    // circles
    //   .append('circle')
    //   .attr('r', (d) => d.value)
    //   .attr('x', 0)
    //   .attr('y', 0)
    //   .style('fill', (d, i) => `url(#glare-gradient-${i})`);


    const text = circles
      .append('text')
      .style('fill', (n) => `${n.type === NodeType.PERSON ? 'white' : 'transparent'}`)
      .text((n) => `${this.showNames ? n.name : ''} ${n.counter ? '(' + n.counter + ')' : ''}`)
      .attr('x', 12)
      .attr('y', 3)
      .style('font-size', '12px');

    svg.select('#light-gradient').attr('refX', 5);
    const selectedNodes = this.persons2Subject.getValue().filter((node1: any) => node1.selected);

    const attractForce = () => {
      selectedNodes.forEach((node1: any) => {
        node1.fx = width / 2;
        node1.fy = height / 2;
      });
    };

    const simulation = forceSimulation(data.nodes)
      .force(
        'link',
        forceLink()
          .links(data.links)
          .id((d: any) => d.id)
          .distance((d) => {
            return d.distance * this.distanceProportion;
          }),
      )
      .force('attract', attractForce)
      .force('charge', forceManyBody<Node>().strength(-this.strengthGraph))
      .on('tick', () => {
        node.attr('transform', (n) => {
          n.x = Math.max(0, Math.min(width, n.x));
          n.y = Math.max(0, Math.min(height, n.y));
          return 'translate(' + n.x + ',' + n.y + ')';
        });
        link
          .attr('x1', (l) => l.source.x)
          .attr('y1', (l) => l.source.y)
          .attr('x2', (l) => l.target.x)
          .attr('y2', (l) => l.target.y);
      });

    return { svg, simulation };
  }

  private dragStart(e: DragEvent, d: Node, simulation) {
    simulation.alphaTarget(0.05).restart();
    d.fx = d.x;
    d.fy = d.y;
    d[d.id] = { x: d.x, y: d.y };
  }

  private drag(e: DragEvent, d: Node, simulation) {
    d.fx = e.x;
    d.fy = e.y;
  }

  private dragEnd(e: DragEvent, d: Node, simulation) {
    simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
    const originalPosition = d[d.id];
    if (originalPosition) {
      d.x = originalPosition.x;
      d.y = originalPosition.y;
    }
  }

  getNodeRadiusValue(counter: number) {
    return counter * 5 + 5;
  }
}
