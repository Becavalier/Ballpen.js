import BallpenUtil from './ballpen-util.js';

class BallpenDecorator  {
	static analyzeDecoratorDependency(str) {
		const _t = str.split('->:');
		return {
			decorators: _t.slice(1),
			modelPath: _t[0]
		};
	}

    static analyzeDecorators(str) {
        return {
            decorators: str.split('->:').slice(1)
        };
    }

    static decorate(globalDecoratorList, decoratorsList, value, clone = true) {
        // Prevent data pollution
        let _f = value;
        if (clone) {
            let _f = BallpenUtil.clone(value);
        } 

        // Deal with decorators
        decoratorsList.decorators.forEach((_v) => {
            _f = globalDecoratorList[_v].call(this, _f);
        });

        return _f;
    }
}

export default BallpenDecorator;
