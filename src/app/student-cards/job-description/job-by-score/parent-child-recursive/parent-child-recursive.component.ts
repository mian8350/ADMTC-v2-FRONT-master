import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormArray } from '@angular/forms';

@Component({
  selector: 'ms-parent-child-recursive',
  templateUrl: './parent-child-recursive.component.html',
  styleUrls: ['./parent-child-recursive.component.scss']
})
export class ParentChildRecursiveComponent implements OnInit {
  @Input() parentChildOptions;
  @Input() questionResponseForm;
  constructor() { }

  ngOnInit() {

  }

  onChangeParentChild2(
    value,
    option,
    index: { competenceIndex: number; segmentIndex: number; questionIndex: number },
    parent: number,
    child: number,
  ) {
    const temp = this.questionResponseForm.get('competence') as UntypedFormArray;
    const competences = temp.value;
    for (
      let i = 0;
      i <
      competences[index.competenceIndex].segment[index.segmentIndex].question[index.questionIndex].parent_child_options[parent]
        .questions[child].parent_child_options.length;
      i++
    ) {
      if (
        competences[index.competenceIndex].segment[index.segmentIndex].question[index.questionIndex].parent_child_options[parent]
          .questions[child].parent_child_options[i].questions[child] !== undefined
      ) {
        competences[index.competenceIndex].segment[index.segmentIndex].question[index.questionIndex].parent_child_options[
          parent
        ].questions[child].parent_child_options[i].questions[child].answer = '';
      }
    }

    // this.getCompetenceForm().patchValue(competences);
  }

}
