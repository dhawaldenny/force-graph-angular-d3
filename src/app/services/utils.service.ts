import { Injectable } from '@angular/core';
import { Sign } from '../enums/sign.enum';

@Injectable({
  providedIn: 'root',
})
export class UtilsService {
  randomNumber(number: number, excludeZero: boolean = true) {
    return Math.floor(Math.random() * number) + (excludeZero ? 1 : 0);
  }

  randomSign(): Sign {
    const values = Object.values(Sign);
    const randomIndex = Math.floor(Math.random() * values.length);
    return values[randomIndex];
  }

  getColorPersonNode(value: number, maxValue: number, minValue: number, opacity: number) {
    const parts = maxValue - minValue;
    const newNumColor = (200 / parts) * (value - minValue);
    // rgb(255, 200, 0)
    // rgb(255, 0, 0)
    return `rgb(255, ${200 - (isNaN(newNumColor) ? 0 : newNumColor)}, 0, ${opacity})`;
  }

  getColorAttributeNode(value: number, maxValue: number, minValue: number, proportion: number, isSelected: boolean = false, opacity: number = 1) {
    const parts = maxValue - minValue;
    const newNumColor = (255 / (isNaN(parts) ? 1 : parts)) * (value - minValue);
    // rgb(255, 255, 255)
    // rgb(0, 0, 0)
    const othersRGB = `rgb(${newNumColor}, ${newNumColor}, ${newNumColor}, ${opacity})`;
    // rgb(255, 0, 255)
    // rgb(0, 0, 255)
    const selectedRGB = `rgb(${newNumColor}, 0, 255, ${opacity})`;
    return isSelected ? selectedRGB : othersRGB;
  }

  getDistancePersonNode(value: number, maxValue: number, minValue: number, proportion: number) {
    const newDistance = ((minValue === 0 ? 0.0001 : minValue) * maxValue) / (value === 0 ? 0.0001 : value);
    const realDistance = (newDistance * 150) / (maxValue === 0 ? 0.0001 : maxValue);
    return realDistance * proportion;
  }

  randomBoolean(int: number) {
    if (int < 1) return true;

    const randomNumber = Math.floor(Math.random() * 100) + 1;
    if (randomNumber <= int) {
      return true;
    } else {
      return false;
    }
  }

  arraysHaveSameElements(array1: string[], array2: string[]) {
    if (array1.length !== array2.length) {
      return false;
    }

    const sortedArray1 = array1.sort();
    const sortedArray2 = array2.sort();

    for (let i = 0; i < sortedArray1.length; i++) {
      if (sortedArray1[i] !== sortedArray2[i]) {
        return false;
      }
    }

    return true;
  }
}
