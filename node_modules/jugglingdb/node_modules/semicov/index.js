var Module = require('module');
var path = require('path');
var fs = require('fs');

exports.addCoverage = function addCoverage(code, filename) {
    if (!~filename.indexOf(addCoverage.subdir)) {
        return code;
    }
    var lines = code.split('\n');

    if (lines.length > 0) {
        lines[0] = 'if (!__cov["' + filename + '"]) {__cov["' + filename + '"] = { 0: 1}; }' + lines[0];
    }

    for (var i = 0; i < lines.length; i++) {
        if (lines[i].match(/^\s\*\s/)) continue;
        var name = '__cov["' + filename + '"][' + i + ']';
        var covLine = ' ' + name + ' = (' + name + ' || 0) + 1;';
        lines[i] = lines[i]
        .replace(/;$/, ';' + covLine)
        .replace(/^\s*(return|throw|break|continue)/, covLine + ' $1');
    }

    return lines.join('\n');
};

exports.init = function init(subdir) {
    if (process.env.NOCOV || global.__cov) return;
    if (!subdir) {
        subdir = process.cwd();
    } else if (!subdir.match(/^\//)) {
        subdir = path.join(process.cwd(), subdir);
    }
    global.__cov = {};
    exports.addCoverage.subdir = subdir;
    var compile = Module.prototype._compile;
    Module.prototype._compile = function (code, filename) {
        if (~filename.indexOf(subdir)) {
            code = exports.addCoverage(code, filename);
        }
        return compile.call(this, code, filename);
    };
};

exports.report = function () {
    if (process.env.NOCOV) return;
    coverageReport();
};

function coverageReport() {
    var cwd = process.cwd(),
    total_lines = 0,
    total_covered = 0,
    files = [];

    for (file in __cov) {
        if (file.search(cwd) === -1 || file.search(cwd + '/node_modules') !== -1) continue;
        var shortFileName = file.replace(cwd + '/', '');
        var id = shortFileName.replace(/[^a-z]+/gi, '-').replace(/^-|-$/, '');
        var code = syntax(fs.readFileSync(file).toString()).split('\n');
        var cnt = code.filter(function (line) {
            return line.match(/;$/) && !line.match(/^\s\*\s/);
        }).length;
        var covered = Object.keys(__cov[file]).length;
        if (covered > cnt) covered = cnt;
        var coveredPercentage = cnt === 0 ? 100 : Math.round((covered / cnt) * 100);
        total_covered += covered;
        total_lines += cnt;
        var html = '<div class="row">';
        html += '<div class="span5">';
        html += '<a href="#' + id +
            '" class="filename" name="' + id +
            '" onclick="var el = document.getElementById(\'' + id +
            '\'); el.style.display = el.style.display ? \'\' : \'none\';">' + shortFileName +
            '</a>';
        html += '</div><div class="span6">';
        var progressClass = 'progress-danger';
        if (coveredPercentage > 30) progressClass = 'progress-warning';
        if (coveredPercentage >= 80) progressClass = 'progress-success';
        html += '<div class="progress ' + progressClass + '"> <div class="bar" style="width: ' + coveredPercentage +
            '%"><strong>' + coveredPercentage +
            '%</strong> [' + cnt + '/' +
            code.length + ']</div></div></div>';
        html += '</div>';

        html += '<div id="' + id + '" style="display:none;"><pre><ol>';
        code.forEach(function (line, i) {
            html += '<li class="' + (__cov[file][i] ? 'covered' : (line.match(/;$/) && !line.match(/ \* /) ? 'uncovered' : '')) + '"><code>' + line + '</code>';
            if (__cov[file][i] && i) {
                html += '<span class="hits">' + __cov[file][i] + '</span>';
            }
            html += '</li>';
        });
        html += '</ol></pre></div>';

        if (cnt > 1) {
            files.push({
                lines: cnt,
                covered: covered,
                id: id,
                name: shortFileName,
                html: html
            });
        }
    }

    var html = files.sort(function (x, y) {
        return y.lines - x.lines;
    }).map(function (f) { return f.html }).join('\n');

    fs.writeFileSync(cwd + '/coverage.html', fs.readFileSync(path.join(__dirname, 'coverage.html')).toString().replace('CODE', html.replace(/\$'/g, '&#36;\'')));
    console.log('====================');
    console.log('TOTAL COVERAGE:', Math.round((total_covered / (total_lines)) * 100) + '%');
}

function syntax(code) {
    var comments    = [];
    var strings     = [];
    var res         = [];
    var all         = { 'C': comments, 'S': strings, 'R': res };
    var safe        = { '<': '&lt;', '>': '&gt;', '&': '&amp;' };

    return code
        .replace(/[<>&]/g, function (m)
            { return safe[m]; })
        .replace(/\/\*[\s\S]*?\*\//g, function(m)
            { var l=comments.length; comments.push(m); return '~~~C'+l+'~~~';   })
        .replace(/([^\\])((?:'(?:\\'|[^'\n])*')|(?:"(?:\\"|[^"\n])*"))/g, function(m, f, s)
            { var l=strings.length; strings.push(s); return f+'~~~S'+l+'~~~'; })
        // .replace(/\/(\\\/|[^\/\n])*\/[gim]{0,3}/g, function(m)
        //    { var l=res.length; res.push(m); return '~~~R'+l+'~~~';   })
        .replace(/(var|function|typeof|new|return|if|for|in|while|break|do|continue|switch|case)([^a-z0-9\$_])/gi,
            '<span class="kwrd">$1</span>$2')
        .replace(/(\{|\}|\]|\[|\|)/gi,
            '<span class="gly">$1</span>')
        .replace(/([a-z\_\$][a-z0-9_]*)[\s]*\(/gi,
            '<span class="func">$1</span>(')
        .replace(/~~~([CSR])(\d+)~~~/g, replaceCSR)

    function replaceCSR(m, t, i) {
        var openTag = '<span class="' + t + '">';
        var closeTag = '</span>';
        return openTag +
            all[t][i].replace(/\n/g, closeTag + '\n' + openTag) +
            closeTag;
    }
}

