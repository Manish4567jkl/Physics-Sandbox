// reset.js

export function resetScene(boxes, world, initialPositions) {
  // Reset physics bodies to their initial positions and zero velocities
  boxes.forEach(({ body }, index) => {
    const pos = initialPositions[index];
    body.position.copy(pos);
    body.velocity.set(0, 0, 0);
    body.angularVelocity.set(0, 0, 0);
    body.quaternion.set(0, 0, 0, 1); // reset rotation
    body.force.set(0, 0, 0);
    body.torque.set(0, 0, 0);
  });

  // Clear forces in the world just in case
  world.clearForces();
}
