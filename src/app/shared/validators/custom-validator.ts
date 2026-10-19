import { AbstractControl, ValidatorFn, Validators } from '@angular/forms';

export interface MyErrorsOptions {
  'zh-cn': string;
  en: string;
}
export type MyValidationErrors = Record<string, MyErrorsOptions>;

export class MyValidators extends Validators {
  /**
   * Custom validator for text input that handles space validation:
   * 1. Not start with space
   * 2. Not end with space
   * 3. Not more than one space between two words
   */
  static spaceValidator(): ValidatorFn {
    return (control: AbstractControl): MyValidationErrors | null => {
      const value = control.value;

      // Allow empty values (handled by required validator if needed)
      if (!value || value === '') {
        return null;
      }

      const stringValue = value.toString();

      // Check 1: Not start with space
      if (stringValue.startsWith(' ')) {
        return {
          spaceValidation: {
            'zh-cn': '不能以空格开头',
            en: 'Cannot start with space',
          },
        };
      }

      // Check 2: Not end with space
      if (stringValue.endsWith(' ')) {
        return {
          spaceValidation: {
            'zh-cn': '不能以空格结尾',
            en: 'Cannot end with space',
          },
        };
      }

      // Check 3: Not more than one space between two words
      if (/\s{2,}/.test(stringValue)) {
        return {
          spaceValidation: {
            'zh-cn': '单词之间不能有多个空格',
            en: 'Cannot have multiple spaces between words',
          },
        };
      }

      // All validations passed
      return null;
    };
  }

  /**
   * Only allow numbers
   * allowed : 0,1,2,3,4,5,6,7,8,9
   * not allowed : a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z
   * not allowed : A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z
   * not allowed : !@#$%^&*()_+{}|:"<>?/.,';[
   */
  static numberValidator(): ValidatorFn {
    return (control: AbstractControl): MyValidationErrors | null => {
      const value = control.value;

      if (!value || value === '') {
        return null;
      }

      const isNumber = /^[0-9]+$/.test(value);

      if (!isNumber) {
        return {
          numberValidation: {
            'zh-cn': '只能包含数字',
            en: 'Can only contain numbers',
          },
        };
      }

      return null;
    };
  }

  /**
   * Only allow letters
   * allowed : a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z
   * allowed : A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z
   * not allowed : 0,1,2,3,4,5,6,7,8,9
   * not allowed : !@#$%^&*()_+{}|:"<>?/.,';[
   */
  static letterValidator(): ValidatorFn {
    return (control: AbstractControl): MyValidationErrors | null => {
      const value = control.value;

      if (!value || value === '') {
        return null;
      }

      const isLetter = /^[a-zA-Z]+$/.test(value);

      if (!isLetter) {
        return {
          letterValidation: {
            'zh-cn': '只能包含字母',
            en: 'Can only contain letters',
          },
        };
      }

      return null;
    };
  }

  /**
   * Only allow letters and numbers
   * allowed : a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z
   * allowed : A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z
   * allowed : 0,1,2,3,4,5,6,7,8,9
   * not allowed : !@#$%^&*()_+{}|:"<>?/.,';[
   */
  static letterNumberValidator(): ValidatorFn {
    return (control: AbstractControl): MyValidationErrors | null => {
      const value = control.value;

      if (!value || value === '') {
        return null;
      }

      const isLetterNumber = /^[a-zA-Z0-9]+$/.test(value);

      if (!isLetterNumber) {
        return {
          letterNumberValidation: {
            'zh-cn': '只能包含字母和数字',
            en: 'Can only contain letters and numbers',
          },
        };
      }

      return null;
    };
  }

  /**
   * Only allow letters and spaces
   * allowed : a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z
   * allowed : A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z
   * allowed : 0,1,2,3,4,5,6,7,8,9
   * not allowed : !@#$%^&*()_+{}|:"<>?/.,';[
   */
  static letterSpaceValidator(): ValidatorFn {
    return (control: AbstractControl): MyValidationErrors | null => {
      const value = control.value;

      if (!value || value === '') {
        return null;
      }

      const isLetterSpace = /^[a-zA-Z ]+$/.test(value);

      if (!isLetterSpace) {
        return {
          letterSpaceValidation: {
            'zh-cn': '只能包含字母和空格',
            en: 'Can only contain letters and spaces',
          },
        };
      }

      return null;
    };
  }

  /***
   * Min Length Validator
   */
  static minLengthValidator(minLength: number): ValidatorFn {
    return (control: AbstractControl): MyValidationErrors | null => {
      const value = control.value;

      if (!value || value === '') {
        return null;
      }

      const isMinLength = value.length >= minLength;

      if (!isMinLength) {
        return {
          minLengthValidation: {
            'zh-cn': `最小长度为 ${minLength}`,
            en: `Minimum length is ${minLength}`,
          },
        };
      }

      return null;
    };
  }

  /***
   * Max Length Validator
   */
  static maxLengthValidator(maxLength: number): ValidatorFn {
    return (control: AbstractControl): MyValidationErrors | null => {
      const value = control.value;

      if (!value || value === '') {
        return null;
      }

      const isMaxLength = value.length <= maxLength;

      if (!isMaxLength) {
        return {
          maxLengthValidation: {
            'zh-cn': `最大长度为 ${maxLength}`,
            en: `Maximum length is ${maxLength}`,
          },
        };
      }

      return null;
    };
  }
}
