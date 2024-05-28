import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ForceGraphComponent } from './force-graph/force-graph.component';
import { FormConfigurationComponent } from './form-configuration/form-configuration.component';
import { MaterialModule } from '../material/material.module';

@NgModule({
  declarations: [ForceGraphComponent, FormConfigurationComponent],
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MaterialModule],
  exports: [ForceGraphComponent, FormConfigurationComponent],
})
export class ComponentsModule {}
