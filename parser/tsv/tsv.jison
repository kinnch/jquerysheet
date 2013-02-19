/* description: Parses a tab separated value to an array */

/* lexical grammar */
%options flex
%lex
%s SINGLE_QUOTE_ON DOUBLE_QUOTE_ON STRING
%%
/* single quote handling*/
<SINGLE_QUOTE_ON>(\n|"\n")               {return 'CHAR';}
<SINGLE_QUOTE_ON>('"')              {return 'CHAR';}
<SINGLE_QUOTE_ON>("'") {
	this.popState();
	this.begin('STRING');
	return 'QUOTE_OFF';
}
<SINGLE_QUOTE_ON>(?=(\t)) {
	this.popState();
	return 'CHAR';
}
(":::::'") {
	this.begin('SINGLE_QUOTE_ON');
	return 'SINGLE_QUOTE_ON';
}
((\t|\n|"\n")"'") {
	this.begin('SINGLE_QUOTE_ON');
	return 'QUOTE_ON';
}

/* double quote handling*/
<DOUBLE_QUOTE_ON>(\n|"\n")             {return 'CHAR';}
<DOUBLE_QUOTE_ON>("'")              {return 'CHAR';}
<DOUBLE_QUOTE_ON>('"') {
	this.popState();
	this.begin('STRING');
	return 'QUOTE_OFF';
}
<DOUBLE_QUOTE_ON>(?=(\t)) {
	this.popState();
	return 'CHAR';
}
(':::::"') {
 	this.begin('DOUBLE_QUOTE_ON');
 	return 'QUOTE_ON';
}
((\t|\n|"\n")'"') {
	this.begin('DOUBLE_QUOTE_ON');
	return 'QUOTE_ON';
}

/*spreadsheet control characters*/
(':::::') {
	return 'BOF';
}
<STRING>(\n|"\n") {
	this.popState();
	return 'END_OF_LINE';
}
<STRING>(\t) {
	this.popState();
	return 'COLUMN_STRING';
}
(\t)                                {return 'COLUMN_EMPTY';}
<STRING>(\s)                        {return 'CHAR';}
<STRING>(.)                         {return 'CHAR';}
<SINGLE_QUOTE_ON>(.)                {return 'CHAR';}
<DOUBLE_QUOTE_ON>(.)                {return 'CHAR';}
(\n|"\n")                                {return 'END_OF_LINE_EMPTY';}

(.) {
	this.begin('STRING');
	return 'CHAR';
}
<<EOF>>	                            {return 'EOF';}


/lex

%start grid

%% /* language grammar */

grid :
	rows EOF {
		return $1;
	}
	| EOF {
		return [['']];
	}
;

rows :
	row {
		$$ = [$1];
	}
	| END_OF_LINE {
        $$ = [];
    }
    | END_OF_LINE_EMPTY {
        $$ = [''];
    }
    | rows END_OF_LINE {
        $$ = $1;
    }
    | rows END_OF_LINE_EMPTY {
        $1[$1.length - 1].push('');
        $$ = $1;
    }
    | rows END_OF_LINE row {
        $1.push($3);
        $$ = $1;
    }
    | rows END_OF_LINE_EMPTY row {
        $1[$1.length - 1].push('');
        $1.push($3);
        $$ = $1;
    }
;

row :
	string {
		$$ = [$1];
	}
	| QUOTE_ON string QUOTE_OFF {
        $$ = [$2];
    }
	| COLUMN_EMPTY {
		$$ = [''];
	}
	| COLUMN_STRING {
        //$$ = [];
    }
    | row QUOTE_ON string QUOTE_OFF {
        $1.push($3);
        $$ = $1;
    }
    | row COLUMN_EMPTY {
        $1.push('');
        $$ = $1;
    }
    | row COLUMN_STRING {
        //$1.push('');
        $$ = $1;
    }
    | row COLUMN_EMPTY string {
        $1.push('');
        $1.push($3);
        $$ = $1;
    }
    | row COLUMN_STRING string {
        //$1.push('');
        $1.push($3);
        $$ = $1;
    }
;

string :
	BOF {
		$$ = '';
	}
	| CHAR {
		$$ = $1;
	}
	| string CHAR {
		$$ = $1 + '' + $2;
	}
;