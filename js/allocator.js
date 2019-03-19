function Allocator(maxCount) {
	this.maxCount = maxCount;
	this.allocatedCount = 0;
}

Allocator.prototype.malloc = function (count) {
	// TODO lookup free space instead of simply allocating at the end
	
	var remainingCount = this.maxCount - this.allocatedCount;
	if (remainingCount < count)
		throw "Out of items (ENOMEM)";
	
	var result = this.allocatedCount;
	
	this.allocatedCount += count;
	
	return result;
};

Allocator.prototype.free = function (count) {
	// TODO
};

Allocator.prototype.getAllocatedCount = function () {
	return this.allocatedCount;
};